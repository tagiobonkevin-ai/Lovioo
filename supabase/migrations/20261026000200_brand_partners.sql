-- Brand Crush: brand and store partner pages. Each product can belong to a brand;
-- featured brands appear in the "Brand Crush" carousel. Admins manage brands.
-- Rollback: supabase/rollback/20261026000200_brand_partners_down.sql

create table public.brands (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  tagline text not null default '' check (char_length(tagline) <= 140),
  description text not null default '' check (char_length(description) <= 2000),
  logo_url text not null default '' check (logo_url = '' or logo_url ~* '^https://'),
  cover_url text not null default '' check (cover_url = '' or cover_url ~* '^https://'),
  color text not null default '#FF2D9A' check (color ~* '^#[0-9a-f]{6}$'),
  store_url text check (store_url ~* '^https://'),
  retailer_id text references public.retailers (id) on update cascade on delete set null,
  featured boolean not null default false,
  published boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.brands.store_url is 'Official / Mall / affiliate store link (https only).';
comment on column public.brands.featured is 'Shown in the Brand Crush carousel as a featured partner.';

create trigger brands_updated_at before update on public.brands
  for each row execute function public.set_updated_at();

alter table public.brands enable row level security;
create policy "brands read" on public.brands for select to anon, authenticated
  using (published or (select public.is_admin()));
create policy "brands admin insert" on public.brands for insert to authenticated
  with check ((select public.is_admin()));
create policy "brands admin update" on public.brands for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "brands admin delete" on public.brands for delete to authenticated
  using ((select public.is_admin()));

alter table public.products add column brand_id text references public.brands (id) on update cascade on delete set null;
create index products_brand_id_idx on public.products (brand_id);

-- One brand per existing brand name (the generic "Top sellers" picks stay unbranded). Nothing is featured yet.
with b as (
  select distinct brand,
    trim(both '-' from regexp_replace(lower(regexp_replace(brand, '[''"’]', '', 'g')), '[^a-z0-9]+', '-', 'g')) as slug
  from public.products
  where brand <> 'Top sellers'
)
insert into public.brands (id, name)
select distinct on (slug) slug, brand from b where slug <> '' order by slug, brand
on conflict (id) do nothing;

update public.products p
set brand_id = trim(both '-' from regexp_replace(lower(regexp_replace(p.brand, '[''"’]', '', 'g')), '[^a-z0-9]+', '-', 'g'))
where p.brand <> 'Top sellers'
  and exists (
    select 1 from public.brands b
    where b.id = trim(both '-' from regexp_replace(lower(regexp_replace(p.brand, '[''"’]', '', 'g')), '[^a-z0-9]+', '-', 'g'))
  );
