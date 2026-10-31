-- Lovioo Brand Partners: brand logins, partner product drafts (live only after Lovioo approves), referral tracking
-- and partner stats (totals only, never shopper identities).
-- Additive only: one new column (brands.is_partner), new tables, new policies alongside the existing ones, one new
-- trigger, new functions and one retailer row. No existing policy, table or column is dropped or changed.
-- Rollback: supabase/rollback/20261106001000_brand_partners_portal_down.sql

-- 1. Which brands are real Lovioo Brand Partners (set by admins, only with an agreement in place).
alter table public.brands add column is_partner boolean not null default false;

-- 2. Logins that belong to a brand.
create table public.brand_members (
  user_id uuid not null references auth.users (id) on delete cascade,
  brand_id text not null references public.brands (id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  primary key (user_id, brand_id)
);
create index brand_members_brand_idx on public.brand_members (brand_id);
alter table public.brand_members enable row level security;
create policy "brand members read own or admin" on public.brand_members for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "brand members admin insert" on public.brand_members for insert to authenticated
  with check ((select public.is_admin()));
create policy "brand members admin delete" on public.brand_members for delete to authenticated
  using ((select public.is_admin()));

/** True when the signed-in user is a login of brand `b`. */
create or replace function public.is_brand_member(b text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.brand_members m where m.user_id = auth.uid() and m.brand_id = b);
$$;
revoke execute on function public.is_brand_member(text) from public, anon;
grant execute on function public.is_brand_member(text) to authenticated;

/** The brands the signed-in user manages in the partner portal. */
create or replace function public.my_partner_brands()
returns table (id text, name text, tagline text, logo_url text, cover_url text, color text, store_url text, is_partner boolean, published boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select b.id, b.name, b.tagline, b.logo_url, b.cover_url, b.color, b.store_url, b.is_partner, b.published
    from public.brands b join public.brand_members m on m.brand_id = b.id
   where m.user_id = auth.uid()
   order by b.name;
$$;
revoke execute on function public.my_partner_brands() from public, anon;
grant execute on function public.my_partner_brands() to authenticated;

-- 3. Partners may draft and edit their own brand's products. guard_product_publish keeps everything they insert
--    unpublished and stops them publishing; guard_live_product_edit / guard_live_offer_edit send changes to live
--    products through the review queue, exactly as for editors.
create policy "products partner read" on public.products for select to authenticated
  using (brand_id is not null and (select public.is_brand_member(brand_id)));
create policy "products partner insert" on public.products for insert to authenticated
  with check (brand_id is not null and (select public.is_brand_member(brand_id)));
create policy "products partner update" on public.products for update to authenticated
  using (brand_id is not null and (select public.is_brand_member(brand_id)))
  with check (brand_id is not null and (select public.is_brand_member(brand_id)));

create policy "offers partner read" on public.offers for select to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.brand_id is not null and public.is_brand_member(p.brand_id)));
create policy "offers partner insert" on public.offers for insert to authenticated
  with check (exists (select 1 from public.products p where p.id = product_id and p.brand_id is not null and public.is_brand_member(p.brand_id)));
create policy "offers partner update" on public.offers for update to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.brand_id is not null and public.is_brand_member(p.brand_id)))
  with check (exists (select 1 from public.products p where p.id = product_id and p.brand_id is not null and public.is_brand_member(p.brand_id)));
create policy "offers partner delete" on public.offers for delete to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.brand_id is not null and public.is_brand_member(p.brand_id)));

create policy "change requests partner insert" on public.product_change_requests for insert to authenticated
  with check (
    requested_by = (select auth.uid()) and status = 'pending' and reviewed_by is null and reviewed_at is null
    and exists (select 1 from public.products p where p.id = product_id and p.brand_id is not null and public.is_brand_member(p.brand_id))
  );

-- 4. No invented ratings or "trending" badges from partners, and the brand name always matches their brand.
create or replace function public.guard_partner_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_editor() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.rating := 0;
    new.review_count := 0;
    new.trending := false;
  else
    new.rating := old.rating;
    new.review_count := old.review_count;
    new.trending := old.trending;
  end if;
  if new.brand_id is not null then
    new.brand := coalesce((select b.name from public.brands b where b.id = new.brand_id), new.brand);
  end if;
  return new;
end;
$$;
revoke execute on function public.guard_partner_fields() from public, anon, authenticated;
create trigger products_guard_partner before insert or update on public.products
  for each row execute function public.guard_partner_fields();

-- 5. A store entry for a brand's own website.
insert into public.retailers (id, name, short, color, text_color, homepage, active, sort)
values ('official', 'Official store', '★', '#FF4FB8', '#fff', 'https://lovioo.shop', true, 50)
on conflict (id) do nothing;

-- 6. Referrals from a partner's own website (?ref=<brand>): counted without any personal data.
create table public.referral_visits (
  id bigint generated always as identity primary key,
  brand_id text not null references public.brands (id) on update cascade on delete cascade,
  path text not null default '' check (char_length(path) <= 200),
  created_at timestamptz not null default now()
);
create index referral_visits_brand_idx on public.referral_visits (brand_id, created_at desc);
create table public.referral_signups (
  user_id uuid primary key references auth.users (id) on delete cascade,
  brand_id text not null references public.brands (id) on update cascade on delete cascade,
  created_at timestamptz not null default now()
);
create index referral_signups_brand_idx on public.referral_signups (brand_id, created_at desc);
alter table public.referral_visits enable row level security;
alter table public.referral_signups enable row level security;
create policy "referral visits admin read" on public.referral_visits for select to authenticated using ((select public.is_admin()));
create policy "referral signups admin read" on public.referral_signups for select to authenticated using ((select public.is_admin()));

/** Counts one visit that arrived from a partner's website. Only partner brands count; nothing about the visitor is kept. */
create or replace function public.record_referral(brand text, path text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.brands b where b.id = brand and b.is_partner and b.published) then
    insert into public.referral_visits (brand_id, path) values (brand, left(coalesce(path, ''), 200));
  end if;
end;
$$;
revoke execute on function public.record_referral(text, text) from public;
grant execute on function public.record_referral(text, text) to anon, authenticated;

/** Credits a brand with a sign-up when a NEW account (made in the last day) arrived from that brand's website. */
create or replace function public.claim_referral(brand text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  if exists (select 1 from public.brands b where b.id = brand and b.is_partner)
     and exists (select 1 from auth.users u where u.id = auth.uid() and u.created_at > now() - interval '1 day') then
    insert into public.referral_signups (user_id, brand_id) values (auth.uid(), brand) on conflict (user_id) do nothing;
  end if;
end;
$$;
revoke execute on function public.claim_referral(text) from public, anon;
grant execute on function public.claim_referral(text) to authenticated;

-- 7. What a partner sees: totals for their own products only.
create or replace function public.partner_stats(brand text, days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(1, least(days, 365)));
  b text := partner_stats.brand;
begin
  if not (public.is_admin() or public.is_brand_member(b)) then
    raise exception 'You can only see stats for your own brand' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'products', (select jsonb_build_object(
        'total', count(*),
        'live', count(*) filter (where published),
        'in_review', count(*) filter (where not published and review_requested_at is not null),
        'drafts', count(*) filter (where not published and review_requested_at is null))
      from public.products where brand_id = b),
    'views', (select count(*) from public.product_events e join public.products p on p.id = e.product_id
               where p.brand_id = b and e.kind = 'view' and e.created_at > since),
    'click_outs', (select count(*) from public.product_events e join public.products p on p.id = e.product_id
               where p.brand_id = b and e.kind = 'click_out' and e.created_at > since),
    'clicks_by_store', coalesce((select jsonb_agg(c order by c.n desc) from (
        select coalesce(e.retailer_id, 'unknown') as retailer_id, count(*) as n
          from public.product_events e join public.products p on p.id = e.product_id
         where p.brand_id = b and e.kind = 'click_out' and e.created_at > since group by 1) c), '[]'::jsonb),
    'swipes', (select jsonb_build_object(
        'love', count(*) filter (where s.action = 'love'),
        'super', count(*) filter (where s.action = 'super'),
        'nope', count(*) filter (where s.action = 'nope'))
      from public.swipes s join public.products p on p.id = s.product_id where p.brand_id = b and s.created_at > since),
    'saves', (select count(*) from public.saved_items si join public.products p on p.id = si.product_id
               where p.brand_id = b and si.created_at > since),
    'referral_visits', (select count(*) from public.referral_visits where brand_id = b and created_at > since),
    'referral_signups', (select count(*) from public.referral_signups where brand_id = b and created_at > since),
    'daily', coalesce((select jsonb_agg(d order by d.day) from (
        select day,
               sum(views)::int as views, sum(clicks)::int as clicks, sum(loves)::int as loves
          from (
            select to_char(date_trunc('day', e.created_at), 'YYYY-MM-DD') as day,
                   (e.kind = 'view')::int as views, (e.kind = 'click_out')::int as clicks, 0 as loves
              from public.product_events e join public.products p on p.id = e.product_id
             where p.brand_id = b and e.created_at > since
            union all
            select to_char(date_trunc('day', s.created_at), 'YYYY-MM-DD'), 0, 0, (s.action <> 'nope')::int
              from public.swipes s join public.products p on p.id = s.product_id
             where p.brand_id = b and s.created_at > since
          ) x group by day) d), '[]'::jsonb),
    'per_product', coalesce((select jsonb_agg(r order by r.views desc, r.loves desc) from (
        select p.id, p.slug, p.name, p.image, p.emoji, p.published,
               (select count(*) from public.product_events e where e.product_id = p.id and e.kind = 'view' and e.created_at > since) as views,
               (select count(*) from public.product_events e where e.product_id = p.id and e.kind = 'click_out' and e.created_at > since) as clicks,
               (select count(*) from public.swipes s where s.product_id = p.id and s.action = 'love' and s.created_at > since) as loves,
               (select count(*) from public.swipes s where s.product_id = p.id and s.action = 'super' and s.created_at > since) as super_loves,
               (select count(*) from public.swipes s where s.product_id = p.id and s.action = 'nope' and s.created_at > since) as nexts,
               (select count(*) from public.saved_items si where si.product_id = p.id and si.created_at > since) as saves
          from public.products p where p.brand_id = b) r), '[]'::jsonb)
  );
end;
$$;
revoke execute on function public.partner_stats(text, integer) from public, anon;
grant execute on function public.partner_stats(text, integer) to authenticated;

-- 8. Admin tools: list partner logins, and link an existing account to a brand.
create or replace function public.admin_partner_members()
returns table (user_id uuid, email text, full_name text, brand_id text, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can see partner logins' using errcode = '42501';
  end if;
  return query
    select m.user_id, u.email::text, coalesce(p.full_name, ''), m.brand_id, m.created_at, u.last_sign_in_at
      from public.brand_members m
      join auth.users u on u.id = m.user_id
      left join public.profiles p on p.id = m.user_id
     order by m.brand_id, u.email;
end;
$$;
revoke execute on function public.admin_partner_members() from public, anon;
grant execute on function public.admin_partner_members() to authenticated;

create or replace function public.admin_link_partner(target_email text, brand text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can add brand partner logins' using errcode = '42501';
  end if;
  if not exists (select 1 from public.brands b where b.id = brand) then
    raise exception 'Unknown brand' using errcode = '22023';
  end if;
  select u.id into uid from auth.users u where lower(u.email) = lower(btrim(target_email));
  if uid is null then
    raise exception 'No Lovioo account uses that email yet' using errcode = '22023';
  end if;
  insert into public.brand_members (user_id, brand_id, created_by) values (uid, brand, auth.uid()) on conflict do nothing;
  update public.brands set is_partner = true where id = brand and not is_partner;
  return uid;
end;
$$;
revoke execute on function public.admin_link_partner(text, text) from public, anon;
grant execute on function public.admin_link_partner(text, text) to authenticated;
