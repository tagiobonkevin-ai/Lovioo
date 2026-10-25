-- Rollback for migrations/20261027000100_catalog_review.sql. Not applied automatically.
begin;
drop function if exists public.reject_product_change(bigint, text);
drop function if exists public.approve_product_change(bigint);
drop trigger if exists product_change_requests_stamp on public.product_change_requests;
drop function if exists public.stamp_change_request();
drop table if exists public.product_change_requests;

drop trigger if exists offers_guard_live on public.offers;
drop function if exists public.guard_live_offer_edit();
drop trigger if exists products_guard_live on public.products;
drop function if exists public.guard_live_product_edit();

-- Publish guard as it was in Phase 1.
create or replace function public.guard_product_publish()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
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

alter table public.products drop column if exists review_requested_by;
alter table public.products drop column if exists review_requested_at;
alter table public.retailers drop constraint if exists retailers_homepage_https;
alter table public.offers drop constraint if exists offers_url_https;
alter table public.products drop constraint if exists products_image_https;
commit;
