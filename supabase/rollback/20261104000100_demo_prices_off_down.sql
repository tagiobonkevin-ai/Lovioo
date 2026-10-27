-- Undo 20261104000100: show the demo seed prices publicly again, and let public_brand_deals() ignore
-- price_tracked as it did before. Nothing was deleted, so this restores the previous behaviour exactly.

update public.products p
   set price_tracked = true
 where not p.price_tracked
   and exists (
     select 1 from public.offers o
      where o.product_id = p.id
        and o.url ~* '//(www\.)?example\.com/'
   );

create or replace function public.public_brand_deals(want integer default 12)
returns table (id text, name text, logo_url text, color text, best_discount integer, products integer)
language sql
stable
security definer
set search_path = ''
as $$
  with best as (
    select distinct on (o.product_id)
           o.product_id,
           case when o.original_price > o.price then round(((o.original_price - o.price)::numeric / o.original_price) * 100)::int else 0 end as pct
      from public.offers o
      join public.retailers r on r.id = o.retailer_id and r.active
     where o.in_stock and o.price > 0
     order by o.product_id, (case when o.original_price > o.price then o.original_price - o.price else 0 end) desc, o.price
  )
  select b.id, b.name, b.logo_url, b.color, max(x.pct)::int, count(*)::int
    from public.brands b
    join public.products p on p.brand_id = b.id and p.published
    join best x on x.product_id = p.id
   where b.published
   group by b.id, b.name, b.logo_url, b.color
  having max(x.pct) > 0
   order by max(x.pct) desc, count(*) desc, b.name
   limit greatest(1, least(coalesce(want, 12), 24));
$$;
