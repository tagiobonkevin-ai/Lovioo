-- Take the demo seed prices off the public front page.
--
-- The 56 products that came from the demo seed carry invented prices and seeded discounts. public_deals()
-- only returns products with price_tracked, so those invented numbers were the ones guests saw as
-- "today's discounts". Clearing the flag hides the prices without touching a single row of data: the
-- products, their offers and their price history all stay exactly as they are, and the rollback script
-- turns the flag back on.
--
-- Real prices entered in Admin -> Price list set price_tracked themselves (app/admin/prices/page.tsx),
-- so the front page starts showing genuine deals again on its own.

-- Demo rows are the ones whose store links still point at the seed's example.com placeholder.
update public.products p
   set price_tracked = false
 where p.price_tracked
   and exists (
     select 1 from public.offers o
      where o.product_id = p.id
        and o.url ~* '//(www\.)?example\.com/'
   );

-- public_brand_deals() never checked price_tracked, so it would still hand anon the invented discount
-- percentages. Same signature, so this replaces the body without a drop.
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
    join public.products p on p.brand_id = b.id and p.published and p.price_tracked
    join best x on x.product_id = p.id
   where b.published
   group by b.id, b.name, b.logo_url, b.color
  having max(x.pct) > 0
   order by max(x.pct) desc, count(*) desc, b.name
   limit greatest(1, least(coalesce(want, 12), 24));
$$;
