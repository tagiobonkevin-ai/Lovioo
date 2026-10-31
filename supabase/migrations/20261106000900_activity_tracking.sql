-- Shopper activity for Admin -> Shopper Insights: what shoppers search for and what they ask Lovioo AI.
-- Two NEW tables and two admin-only functions; no existing table changes.
-- Privacy (see /privacy): every search and question is counted; it is linked to an account (user_id) only when that
-- shopper allowed analytics. Only admins can read these rows. Text is length-capped.
-- Rollback: supabase/rollback/20261106000900_activity_tracking_down.sql

create table public.search_events (
  id bigint generated always as identity primary key,
  query text not null check (char_length(query) between 1 and 200),
  results integer not null default 0 check (results >= 0),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index search_events_created_idx on public.search_events (created_at desc);
create index search_events_user_idx on public.search_events (user_id) where user_id is not null;

create table public.ai_events (
  id bigint generated always as identity primary key,
  question text not null check (char_length(question) between 1 and 500),
  lang text not null default 'en' check (lang in ('en', 'tl', 'ceb')),
  results integer not null default 0 check (results >= 0),
  source text not null default 'app' check (source in ('home', 'app')),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index ai_events_created_idx on public.ai_events (created_at desc);
create index ai_events_user_idx on public.ai_events (user_id) where user_id is not null;

create trigger search_events_created_at before insert on public.search_events
  for each row execute function public.force_created_at();
create trigger ai_events_created_at before insert on public.ai_events
  for each row execute function public.force_created_at();

alter table public.search_events enable row level security;
alter table public.ai_events enable row level security;
create policy "search events insert" on public.search_events for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
create policy "search events admin read" on public.search_events for select to authenticated
  using ((select public.is_admin()));
create policy "ai events insert" on public.ai_events for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
create policy "ai events admin read" on public.ai_events for select to authenticated
  using ((select public.is_admin()));

/** Everything Admin -> Shopper Insights shows, for the last `days` days. Admins only. */
create or replace function public.admin_insights(days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(1, least(days, 365)));
begin
  if not public.is_admin() then
    raise exception 'Only admins can see shopper insights' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'swipes', (select jsonb_build_object(
        'love', count(*) filter (where action = 'love'),
        'super', count(*) filter (where action = 'super'),
        'nope', count(*) filter (where action = 'nope'))
      from public.swipes where created_at > since),
    'swipes_daily', coalesce((select jsonb_agg(d order by d.day) from (
        select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
               count(*) filter (where action = 'love') as love,
               count(*) filter (where action = 'super') as super,
               count(*) filter (where action = 'nope') as nope
          from public.swipes where created_at > since group by 1) d), '[]'::jsonb),
    'top_loved', coalesce((select jsonb_agg(t order by t.n desc) from (
        select p.id, p.slug, p.name, p.brand, p.image, p.emoji, count(*) as n
          from public.swipes s join public.products p on p.id = s.product_id
         where s.action = 'love' and s.created_at > since
         group by p.id order by n desc limit 10) t), '[]'::jsonb),
    'top_super', coalesce((select jsonb_agg(t order by t.n desc) from (
        select p.id, p.slug, p.name, p.brand, p.image, p.emoji, count(*) as n
          from public.swipes s join public.products p on p.id = s.product_id
         where s.action = 'super' and s.created_at > since
         group by p.id order by n desc limit 10) t), '[]'::jsonb),
    'top_nope', coalesce((select jsonb_agg(t order by t.n desc) from (
        select p.id, p.slug, p.name, p.brand, p.image, p.emoji, count(*) as n
          from public.swipes s join public.products p on p.id = s.product_id
         where s.action = 'nope' and s.created_at > since
         group by p.id order by n desc limit 10) t), '[]'::jsonb),
    'saves', (select count(*) from public.saved_items where created_at > since),
    'views', (select count(*) from public.product_events where kind = 'view' and created_at > since),
    'click_outs', (select count(*) from public.product_events where kind = 'click_out' and created_at > since),
    'clicks_by_store', coalesce((select jsonb_agg(c order by c.n desc) from (
        select coalesce(retailer_id, 'unknown') as retailer_id, count(*) as n
          from public.product_events where kind = 'click_out' and created_at > since group by 1) c), '[]'::jsonb),
    'searches', (select count(*) from public.search_events where created_at > since),
    'top_searches', coalesce((select jsonb_agg(q order by q.n desc) from (
        select lower(btrim(query)) as query, count(*) as n, round(avg(results))::int as avg_results
          from public.search_events where created_at > since group by 1 order by n desc limit 20) q), '[]'::jsonb),
    'empty_searches', coalesce((select jsonb_agg(q order by q.n desc) from (
        select lower(btrim(query)) as query, count(*) as n
          from public.search_events where results = 0 and created_at > since group by 1 order by n desc limit 20) q), '[]'::jsonb),
    'recent_searches', coalesce((select jsonb_agg(r order by r.created_at desc) from (
        select e.query, e.results, e.created_at, pr.full_name as shopper, pr.email
          from public.search_events e left join public.profiles pr on pr.id = e.user_id
         where e.created_at > since order by e.created_at desc limit 50) r), '[]'::jsonb),
    'ai_questions', (select count(*) from public.ai_events where created_at > since),
    'ai_by_lang', coalesce((select jsonb_agg(l order by l.n desc) from (
        select lang, count(*) as n from public.ai_events where created_at > since group by 1) l), '[]'::jsonb),
    'ai_no_match', coalesce((select jsonb_agg(q order by q.n desc) from (
        select lower(btrim(question)) as question, count(*) as n
          from public.ai_events where results = 0 and created_at > since group by 1 order by n desc limit 20) q), '[]'::jsonb),
    'recent_ai', coalesce((select jsonb_agg(r order by r.created_at desc) from (
        select e.question, e.lang, e.results, e.source, e.created_at, pr.full_name as shopper, pr.email
          from public.ai_events e left join public.profiles pr on pr.id = e.user_id
         where e.created_at > since order by e.created_at desc limit 50) r), '[]'::jsonb)
  );
end;
$$;
revoke execute on function public.admin_insights(integer) from public, anon;
grant execute on function public.admin_insights(integer) to authenticated;

/** Deletes search and Lovioo AI activity older than `months` months (the Privacy Policy keeps it 12). Admins only. */
create or replace function public.purge_old_activity(months integer default 12)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  cutoff timestamptz := now() - make_interval(months => greatest(1, months));
  n1 integer;
  n2 integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete activity' using errcode = '42501';
  end if;
  delete from public.search_events where created_at < cutoff;
  get diagnostics n1 = row_count;
  delete from public.ai_events where created_at < cutoff;
  get diagnostics n2 = row_count;
  return n1 + n2;
end;
$$;
revoke execute on function public.purge_old_activity(integer) from public, anon;
grant execute on function public.purge_old_activity(integer) to authenticated;
