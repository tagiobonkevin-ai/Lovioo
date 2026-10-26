-- Rollback for migrations/20261103000100_product_gallery.sql. Not applied automatically.
-- Removes the extra product photos and restores the guard and approve function from 20261027000100.
-- Any gallery photos already saved are lost; the cover image (products.image) is untouched.

alter table public.products drop column if exists images;

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
