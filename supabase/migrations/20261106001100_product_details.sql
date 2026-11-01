-- Richer product pages: colors/shades, store promotions, a labelled store rating, price ranges per store, and
-- reviews written by Lovioo members. Additive: new columns (with shape checks), one new table, and updated versions
-- of three existing functions (same signatures) so the new fields follow the existing review rules.
-- Rollback: supabase/rollback/20261106001100_product_details_down.sql

-- 1. Shape checks for the new JSON columns.
create or replace function public.valid_product_colors(c jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(c) = 'array' and jsonb_array_length(c) <= 24 and not exists (
    select 1 from jsonb_array_elements(c) e
     where jsonb_typeof(e) <> 'object'
        or coalesce(char_length(e ->> 'name'), 0) not between 1 and 40
        or coalesce(e ->> 'hex', '') !~ '^(#[0-9A-Fa-f]{6})?$'
        or (coalesce(e ->> 'image', '') <> '' and ((e ->> 'image') !~* '^https://' or char_length(e ->> 'image') > 1000))
  );
$$;

create or replace function public.valid_product_promotions(p jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p) = 'array' and jsonb_array_length(p) <= 6 and not exists (
    select 1 from jsonb_array_elements(p) e
     where jsonb_typeof(e) <> 'object'
        or coalesce(char_length(e ->> 'text'), 0) not between 1 and 80
        or coalesce(char_length(e ->> 'retailer_id'), 0) > 40
        or coalesce(e ->> 'ends_on', '') !~ '^(\d{4}-\d{2}-\d{2})?$'
  );
$$;

-- 2. New product and offer columns.
alter table public.products
  add column colors jsonb not null default '[]'::jsonb constraint products_colors_valid check (public.valid_product_colors(colors)),
  add column promotions jsonb not null default '[]'::jsonb constraint products_promotions_valid check (public.valid_product_promotions(promotions)),
  add column rating_source text references public.retailers (id) on update cascade on delete set null;
comment on column public.products.rating_source is 'Store the rating and review count were copied from (shown as "on <store>").';

alter table public.offers
  add column price_max integer constraint offers_price_max_valid check (price_max is null or price_max >= price);
comment on column public.offers.price_max is 'Top of a price range at this store (e.g. shades or sizes priced differently); price is the lowest.';

-- 3. Changes to live products still go through review, now including the new fields.
create or replace function public.guard_live_product_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_admin() or not old.published then
    return new;
  end if;
  if (new.name, new.slug, new.brand, new.brand_id, new.category_id, new.subcategory, new.emoji, new.image, new.images, new.tags, new.vibes,
      new.description, new.highlights, new.is_new, new.trending, new.rating, new.review_count, new.colors, new.promotions, new.rating_source)
     is distinct from
     (old.name, old.slug, old.brand, old.brand_id, old.category_id, old.subcategory, old.emoji, old.image, old.images, old.tags, old.vibes,
      old.description, old.highlights, old.is_new, old.trending, old.rating, old.review_count, old.colors, old.promotions, old.rating_source) then
    raise exception 'This product is live — submit your changes for review' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.guard_live_product_edit() from public, anon, authenticated;

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
    new.rating_source := null;
  else
    new.rating := old.rating;
    new.review_count := old.review_count;
    new.trending := old.trending;
    new.rating_source := old.rating_source;
  end if;
  if new.brand_id is not null then
    new.brand := coalesce((select b.name from public.brands b where b.id = new.brand_id), new.brand);
  end if;
  return new;
end;
$$;
revoke execute on function public.guard_partner_fields() from public, anon, authenticated;

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
      images = case when p ? 'images' then array(select jsonb_array_elements_text(p -> 'images')) else images end,
      description = coalesce(p ->> 'description', description),
      tags = case when p ? 'tags' then array(select jsonb_array_elements_text(p -> 'tags')) else tags end,
      vibes = case when p ? 'vibes' then array(select jsonb_array_elements_text(p -> 'vibes')) else vibes end,
      highlights = case when p ? 'highlights' then array(select jsonb_array_elements_text(p -> 'highlights')) else highlights end,
      is_new = coalesce((p ->> 'is_new')::boolean, is_new),
      trending = coalesce((p ->> 'trending')::boolean, trending),
      rating = coalesce((p ->> 'rating')::numeric, rating),
      review_count = coalesce((p ->> 'review_count')::integer, review_count),
      colors = case when p ? 'colors' then coalesce(p -> 'colors', '[]'::jsonb) else colors end,
      promotions = case when p ? 'promotions' then coalesce(p -> 'promotions', '[]'::jsonb) else promotions end,
      rating_source = case when p ? 'rating_source' then nullif(p ->> 'rating_source', '') else rating_source end
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

-- 4. Reviews written by Lovioo members (members-only, like the catalogue). Shown with first name + last initial.
create table public.product_reviews (
  id bigint generated always as identity primary key,
  product_id text not null references public.products (id) on update cascade on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  rating smallint not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 1000),
  reviewer_name text not null default '',
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index product_reviews_product_idx on public.product_reviews (product_id, created_at desc);
create index product_reviews_user_idx on public.product_reviews (user_id);

create or replace function public.stamp_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  full_name text;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and not public.is_admin()
       and not exists (select 1 from public.products p where p.id = new.product_id and p.published) then
      raise exception 'You can only review products that are live on Lovioo' using errcode = '42501';
    end if;
    select pr.full_name into full_name from public.profiles pr where pr.id = new.user_id;
    full_name := btrim(coalesce(full_name, ''));
    new.reviewer_name := case
      when full_name = '' then 'Lovioo shopper'
      when position(' ' in full_name) = 0 then left(full_name, 30)
      else left(split_part(full_name, ' ', 1), 30) || ' ' || upper(left(regexp_replace(full_name, '^.*\s', ''), 1)) || '.'
    end;
    new.created_at := now();
    if not public.is_admin() then
      new.hidden := false;
    end if;
  else
    new.product_id := old.product_id;
    new.user_id := old.user_id;
    new.reviewer_name := old.reviewer_name;
    new.created_at := old.created_at;
    if not public.is_admin() then
      new.hidden := old.hidden;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke execute on function public.stamp_review() from public, anon, authenticated;
create trigger product_reviews_stamp before insert or update on public.product_reviews
  for each row execute function public.stamp_review();

alter table public.product_reviews enable row level security;
create policy "reviews read" on public.product_reviews for select to authenticated
  using (not hidden or user_id = (select auth.uid()) or (select public.is_admin()));
create policy "reviews insert own" on public.product_reviews for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "reviews update own or admin" on public.product_reviews for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "reviews delete own or admin" on public.product_reviews for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
