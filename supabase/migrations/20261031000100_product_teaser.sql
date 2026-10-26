-- Home page teaser for guests: product photos and names only, never prices, offers or ids. Products themselves become
-- members-only in 20261031000200_members_only_catalog.sql, so this is the one thing about products a guest can read.
-- Additive only. Rollback: supabase/rollback/20261031000100_product_teaser_down.sql

create or replace function public.product_teaser()
returns table (name text, brand text, image text, emoji text, category_id text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.name, p.brand, p.image, p.emoji, p.category_id
  from public.products p
  where p.published
    and exists (select 1 from public.offers o where o.product_id = p.id)
  order by (p.image ~* '^https://') desc, p.sort, p.created_at
  limit 40;
$$;
revoke execute on function public.product_teaser() from public;
grant execute on function public.product_teaser() to anon, authenticated;
