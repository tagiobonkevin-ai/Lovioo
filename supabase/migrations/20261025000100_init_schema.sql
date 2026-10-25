-- Lovioo core schema: catalog, shopper data, analytics events and admin role.

-- ---------------------------------------------------------------------------
-- Admin role
-- ---------------------------------------------------------------------------
create table public.admins (
  email text primary key check (email = lower(email)),
  added_at timestamptz not null default now()
);

-- True when the caller is signed in with a confirmed email that is listed in public.admins.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.admins a on a.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table public.categories (
  id text primary key,
  name text not null,
  emoji text not null default '✨',
  tint text not null default '#FFE9E2',
  sort int not null default 0
);

create table public.retailers (
  id text primary key,
  name text not null,
  short text not null,
  color text not null,
  text_color text not null default '#ffffff',
  homepage text,
  active boolean not null default true,
  sort int not null default 0
);

create table public.products (
  id text primary key default ('p_' || substr(md5(random()::text), 1, 10)),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  brand text not null,
  category_id text not null references public.categories (id) on update cascade,
  subcategory text not null default '',
  emoji text not null default '🛍️',
  image text not null default '',
  tags text[] not null default '{}',
  vibes text[] not null default '{}',
  rating numeric(2, 1) not null default 4.5 check (rating between 0 and 5),
  review_count int not null default 0 check (review_count >= 0),
  description text not null default '',
  highlights text[] not null default '{}',
  is_new boolean not null default false,
  trending boolean not null default false,
  published boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.offers (
  product_id text not null references public.products (id) on delete cascade,
  retailer_id text not null references public.retailers (id) on update cascade,
  price int not null check (price >= 0),
  original_price int not null check (original_price >= 0),
  shipping int not null default 0 check (shipping >= 0),
  in_stock boolean not null default true,
  url text not null default '',
  updated_at timestamptz not null default now(),
  primary key (product_id, retailer_id)
);
create index offers_retailer_idx on public.offers (retailer_id);
create trigger offers_updated_at before update on public.offers
  for each row execute function public.set_updated_at();

-- One price per product, store and day.
create table public.price_history (
  product_id text not null references public.products (id) on delete cascade,
  retailer_id text not null references public.retailers (id) on update cascade,
  day date not null,
  price int not null check (price >= 0),
  primary key (product_id, retailer_id, day)
);
create index price_history_day_idx on public.price_history (day);
create index price_history_retailer_idx on public.price_history (retailer_id);

-- Every offer price change is recorded as today's price for that store.
create or replace function public.record_offer_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.price_history (product_id, retailer_id, day, price)
  values (new.product_id, new.retailer_id, current_date, new.price)
  on conflict (product_id, retailer_id, day) do update set price = excluded.price;
  return new;
end;
$$;
create trigger offers_record_price after insert or update of price on public.offers
  for each row execute function public.record_offer_price();

-- 90-day stats on the lowest daily price across stores; drives deal scores in the app.
create view public.product_price_stats
with (security_invoker = true)
as
with daily as (
  select product_id, day, min(price) as price
  from public.price_history
  where day > current_date - 90
  group by product_id, day
)
select
  product_id,
  min(price)::int as low_90,
  round(avg(price))::int as avg_90,
  max(price)::int as high_90,
  count(*)::int as days
from daily
group by product_id;

-- ---------------------------------------------------------------------------
-- Shoppers
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  interests text[] not null default '{}',
  budget text check (budget in ('under500', '500to2000', '2000to10000', 'over10000')),
  platforms text[] not null default '{shopee,lazada,tiktok,amazon}',
  onboarded boolean not null default false,
  streak int not null default 0,
  streak_day date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.saved_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index saved_items_product_idx on public.saved_items (product_id);

create table public.price_alerts (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  target_price int not null check (target_price >= 0),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index price_alerts_product_idx on public.price_alerts (product_id);

create table public.swipes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  action text not null check (action in ('love', 'nope', 'super')),
  created_at timestamptz not null default now()
);
create index swipes_user_idx on public.swipes (user_id, created_at desc);
create index swipes_product_idx on public.swipes (product_id);

-- Anonymous-friendly analytics (views, store click-outs).
create table public.product_events (
  id bigint generated always as identity primary key,
  product_id text not null references public.products (id) on delete cascade,
  kind text not null check (kind in ('view', 'click_out', 'save')),
  retailer_id text references public.retailers (id) on update cascade,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index product_events_product_idx on public.product_events (product_id, created_at desc);
create index product_events_created_idx on public.product_events (created_at desc);
create index product_events_user_idx on public.product_events (user_id);
create index product_events_retailer_idx on public.product_events (retailer_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.retailers enable row level security;
alter table public.products enable row level security;
alter table public.offers enable row level security;
alter table public.price_history enable row level security;
alter table public.profiles enable row level security;
alter table public.saved_items enable row level security;
alter table public.price_alerts enable row level security;
alter table public.swipes enable row level security;
alter table public.product_events enable row level security;

-- Admin list: only admins can see or change it.
create policy "admins manage admins" on public.admins
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Catalog: public read, admin write.
create policy "catalog read" on public.categories for select to anon, authenticated using (true);
create policy "catalog admin insert" on public.categories for insert to authenticated with check ((select public.is_admin()));
create policy "catalog admin update" on public.categories for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "catalog admin delete" on public.categories for delete to authenticated using ((select public.is_admin()));

create policy "retailers read" on public.retailers for select to anon, authenticated using (true);
create policy "retailers admin insert" on public.retailers for insert to authenticated with check ((select public.is_admin()));
create policy "retailers admin update" on public.retailers for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "retailers admin delete" on public.retailers for delete to authenticated using ((select public.is_admin()));

create policy "products read" on public.products for select to anon, authenticated
  using (published or (select public.is_admin()));
create policy "products admin insert" on public.products for insert to authenticated with check ((select public.is_admin()));
create policy "products admin update" on public.products for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "products admin delete" on public.products for delete to authenticated using ((select public.is_admin()));

create policy "offers read" on public.offers for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_admin()))));
create policy "offers admin insert" on public.offers for insert to authenticated with check ((select public.is_admin()));
create policy "offers admin update" on public.offers for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "offers admin delete" on public.offers for delete to authenticated using ((select public.is_admin()));

create policy "history read" on public.price_history for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_admin()))));
create policy "history admin insert" on public.price_history for insert to authenticated with check ((select public.is_admin()));
create policy "history admin update" on public.price_history for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "history admin delete" on public.price_history for delete to authenticated using ((select public.is_admin()));

-- Profiles: own row, admins can read all.
create policy "profiles read own or admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Shopper rows: owner full access, admins read.
create policy "saved read own or admin" on public.saved_items for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "saved insert own" on public.saved_items for insert to authenticated with check (user_id = (select auth.uid()));
create policy "saved delete own" on public.saved_items for delete to authenticated using (user_id = (select auth.uid()));

create policy "alerts read own or admin" on public.price_alerts for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "alerts insert own" on public.price_alerts for insert to authenticated with check (user_id = (select auth.uid()));
create policy "alerts update own" on public.price_alerts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "alerts delete own" on public.price_alerts for delete to authenticated using (user_id = (select auth.uid()));

create policy "swipes read own or admin" on public.swipes for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "swipes insert own" on public.swipes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "swipes delete own" on public.swipes for delete to authenticated using (user_id = (select auth.uid()));

-- Events: anyone can log (as themselves or anonymously), only admins read.
create policy "events insert" on public.product_events for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
create policy "events admin read" on public.product_events for select to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Admin analytics
-- ---------------------------------------------------------------------------
create or replace function public.admin_overview(days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  since date := current_date - greatest(days, 1);
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'products', (select count(*) from public.products),
    'published', (select count(*) from public.products where published),
    'retailers_active', (select count(*) from public.retailers where active),
    'offers', (select count(*) from public.offers),
    'price_updates', (select count(*) from public.price_history where day > since),
    'users', (select count(*) from public.profiles),
    'saved', (select count(*) from public.saved_items),
    'alerts', (select count(*) from public.price_alerts where enabled),
    'swipes', (select count(*) from public.swipes where created_at > since),
    'loves', (select count(*) from public.swipes where created_at > since and action <> 'nope'),
    'views', (select count(*) from public.product_events where kind = 'view' and created_at > since),
    'click_outs', (select count(*) from public.product_events where kind = 'click_out' and created_at > since),
    -- Price index per store: each product/store price relative to its own average over the window, averaged per day.
    'price_trend', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.day, t.retailer_id)
      from (
        select h.day, h.retailer_id, round(avg(h.price::numeric / nullif(b.avg_price, 0) * 100), 1) as idx
        from public.price_history h
        join (
          select product_id, retailer_id, avg(price) as avg_price
          from public.price_history
          where day > since
          group by product_id, retailer_id
        ) b using (product_id, retailer_id)
        where h.day > since
        group by h.day, h.retailer_id
      ) t
    ), '[]'::jsonb),
    'top_categories', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.score desc)
      from (
        select category_id, sum(score)::int as score
        from (
          select p.category_id,
            (select count(*) from public.product_events e where e.product_id = p.id and e.created_at > since)
              + 3 * (select count(*) from public.saved_items s where s.product_id = p.id) as score
          from public.products p
        ) per_product
        group by category_id
        order by score desc
        limit 5
      ) t
    ), '[]'::jsonb),
    'top_products', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.score desc)
      from (
        select p.id, p.name, p.emoji, p.image,
          (select count(*) from public.product_events e where e.product_id = p.id and e.kind = 'view' and e.created_at > since) as views,
          (select count(*) from public.saved_items s where s.product_id = p.id) as saves,
          (select count(*) from public.swipes w where w.product_id = p.id and w.action <> 'nope' and w.created_at > since) as loves,
          (select count(*) from public.product_events e where e.product_id = p.id and e.kind = 'view' and e.created_at > since)
            + 3 * (select count(*) from public.saved_items s where s.product_id = p.id)
            + 2 * (select count(*) from public.swipes w where w.product_id = p.id and w.action <> 'nope' and w.created_at > since) as score
        from public.products p
        order by score desc, p.name
        limit 8
      ) t
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke execute on function public.admin_overview(int) from public, anon;
grant execute on function public.admin_overview(int) to authenticated;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
