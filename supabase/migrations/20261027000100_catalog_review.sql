-- Phase 2: catalog hardening.
-- 1. Links must be https (or empty) in the database, not just in the admin UI.
-- 2. Editors can change prices and stock of LIVE products directly; any other change to a live product
--    (name, photos, description, tags, category, brand, store links, adding/removing stores) goes through
--    a review request that an admin approves or sends back. Drafts stay fully editable by editors.
-- 3. Editors can mark a draft "ready to publish" for the admin review queue.
-- Non-destructive (no drops). Rollback: supabase/rollback/20261027000100_catalog_review_down.sql

-- 1. Link rules (all current rows already comply).
alter table public.products add constraint products_image_https check (image = '' or image ~* '^https://');
alter table public.offers add constraint offers_url_https check (url = '' or url ~* '^https://');
alter table public.retailers add constraint retailers_homepage_https check (homepage is null or homepage = '' or homepage ~* '^https://');

-- 3. Draft submission.
alter table public.products add column review_requested_at timestamptz;
alter table public.products add column review_requested_by uuid references auth.users (id) on delete set null;
comment on column public.products.review_requested_at is 'Set when an editor marks a draft ready to publish; cleared when it is published.';

-- Publishing clears the submission; non-admins still can't publish (unchanged from Phase 1).
create or replace function public.guard_product_publish()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.published and (tg_op = 'INSERT' or not old.published) then
    new.review_requested_at := null;
    new.review_requested_by := null;
  end if;
  -- No end user (SQL editor, migrations): RLS already keeps anonymous API calls out.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.published := false;
  elsif new.published is distinct from old.published then
    raise exception 'Only admins can publish or unpublish products' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- 2a. Live products: editors may only change pricing-related columns.
create or replace function public.guard_live_product_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_admin() or not old.published then
    return new;
  end if;
  if (new.name, new.slug, new.brand, new.brand_id, new.category_id, new.subcategory, new.emoji, new.image, new.tags, new.vibes,
      new.description, new.highlights, new.is_new, new.trending, new.rating, new.review_count)
     is distinct from
     (old.name, old.slug, old.brand, old.brand_id, old.category_id, old.subcategory, old.emoji, old.image, old.tags, old.vibes,
      old.description, old.highlights, old.is_new, old.trending, old.rating, old.review_count) then
    raise exception 'This product is live — submit your changes for review' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.guard_live_product_edit() from public, anon, authenticated;
create trigger products_guard_live before update on public.products
  for each row execute function public.guard_live_product_edit();

-- 2b. Live products' store offers: editors may change price, was-price, shipping and stock — not links, and
-- they can't add or remove stores. Upserts (the Price list) fire the INSERT check first, so an insert for an
-- offer that already exists is let through; its UPDATE check runs next.
create or replace function public.guard_live_offer_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  live boolean;
begin
  if auth.uid() is null or public.is_admin() then
    return coalesce(new, old);
  end if;
  select p.published into live from public.products p where p.id = coalesce(new.product_id, old.product_id);
  if not coalesce(live, false) then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' then
    raise exception 'Removing a store from a live product needs admin review' using errcode = '42501';
  elsif tg_op = 'INSERT' then
    if exists (select 1 from public.offers o where o.product_id = new.product_id and o.retailer_id = new.retailer_id) then
      return new;
    end if;
    raise exception 'Adding a store to a live product needs admin review' using errcode = '42501';
  elsif new.url is distinct from old.url or new.product_id <> old.product_id or new.retailer_id <> old.retailer_id then
    raise exception 'Store links on a live product need admin review' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.guard_live_offer_edit() from public, anon, authenticated;
create trigger offers_guard_live before insert or update or delete on public.offers
  for each row execute function public.guard_live_offer_edit();

-- 2c. Review requests.
create table public.product_change_requests (
  id bigint generated always as identity primary key,
  product_id text not null references public.products (id) on update cascade on delete cascade,
  requested_by uuid references auth.users (id) on delete set null,
  requested_by_email text,
  -- {"product": {field: value, ...}, "offers": {retailer_id: {"url": "..."}, ...}}
  changes jsonb not null check (jsonb_typeof(changes) = 'object' and changes <> '{}'::jsonb),
  note text not null default '' check (char_length(note) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_by_email text,
  review_note text not null default '' check (char_length(review_note) <= 1000),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index product_change_requests_status_idx on public.product_change_requests (status, created_at);
create index product_change_requests_product_idx on public.product_change_requests (product_id);

alter table public.product_change_requests enable row level security;
create policy "change requests editor insert" on public.product_change_requests for insert to authenticated
  with check ((select public.is_editor()) and requested_by = (select auth.uid()) and status = 'pending' and reviewed_by is null and reviewed_at is null);
create policy "change requests read own or admin" on public.product_change_requests for select to authenticated
  using (requested_by = (select auth.uid()) or (select public.is_admin()));
-- No update/delete policies: requests change only through approve/reject below.

create or replace function public.stamp_change_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_at := now();
  new.requested_by_email := (select u.email from auth.users u where u.id = auth.uid());
  return new;
end;
$$;
revoke execute on function public.stamp_change_request() from public, anon, authenticated;
create trigger product_change_requests_stamp before insert on public.product_change_requests
  for each row execute function public.stamp_change_request();

create or replace function public.approve_product_change(request_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.product_change_requests;
  p jsonb;
  k text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can approve changes' using errcode = '42501';
  end if;
  select * into r from public.product_change_requests where id = request_id for update;
  if not found or r.status <> 'pending' then
    raise exception 'This request is no longer pending' using errcode = 'P0002';
  end if;

  p := r.changes -> 'product';
  if p is not null and jsonb_typeof(p) = 'object' then
    update public.products set
      name = coalesce(p ->> 'name', name),
      slug = coalesce(p ->> 'slug', slug),
      brand = coalesce(p ->> 'brand', brand),
      brand_id = case when p ? 'brand_id' then nullif(p ->> 'brand_id', '') else brand_id end,
      category_id = coalesce(p ->> 'category_id', category_id),
      subcategory = coalesce(p ->> 'subcategory', subcategory),
      emoji = coalesce(p ->> 'emoji', emoji),
      image = coalesce(p ->> 'image', image),
      description = coalesce(p ->> 'description', description),
      tags = case when p ? 'tags' then array(select jsonb_array_elements_text(p -> 'tags')) else tags end,
      vibes = case when p ? 'vibes' then array(select jsonb_array_elements_text(p -> 'vibes')) else vibes end,
      highlights = case when p ? 'highlights' then array(select jsonb_array_elements_text(p -> 'highlights')) else highlights end,
      is_new = coalesce((p ->> 'is_new')::boolean, is_new),
      trending = coalesce((p ->> 'trending')::boolean, trending),
      rating = coalesce((p ->> 'rating')::numeric, rating),
      review_count = coalesce((p ->> 'review_count')::integer, review_count)
    where id = r.product_id;
  end if;

  if jsonb_typeof(r.changes -> 'offers') = 'object' then
    for k in select jsonb_object_keys(r.changes -> 'offers') loop
      update public.offers
      set url = coalesce(r.changes -> 'offers' -> k ->> 'url', url)
      where product_id = r.product_id and retailer_id = k;
    end loop;
  end if;

  update public.product_change_requests
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(),
      reviewed_by_email = (select u.email from auth.users u where u.id = auth.uid())
  where id = request_id;
end;
$$;
revoke execute on function public.approve_product_change(bigint) from public, anon;
grant execute on function public.approve_product_change(bigint) to authenticated;

create or replace function public.reject_product_change(request_id bigint, note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can review changes' using errcode = '42501';
  end if;
  update public.product_change_requests
  set status = 'rejected', review_note = left(coalesce(note, ''), 1000), reviewed_by = auth.uid(), reviewed_at = now(),
      reviewed_by_email = (select u.email from auth.users u where u.id = auth.uid())
  where id = request_id and status = 'pending';
  if not found then
    raise exception 'This request is no longer pending' using errcode = 'P0002';
  end if;
end;
$$;
revoke execute on function public.reject_product_change(bigint, text) from public, anon;
grant execute on function public.reject_product_change(bigint, text) to authenticated;
