-- The front page's shop window: a small, curated set of the best-discounted products, with prices, that guests can
-- see before they have an account. The catalogue itself stays members-only (20261031000200) — these two functions are
-- the only way prices leave the database without a sign-in.
-- The front page works out its own discount percentages from price and original_price, so it doesn't depend
-- on discount_pct here.
-- Additive only. Rollback: supabase/rollback/20261102000100_public_deals_down.sql

/** Up to `want` published products with the biggest discount right now, with their best offer. */
create or replace function public.public_deals(want integer default 24)
returns table (
  slug text, name text, brand text, brand_id text, category_id text, subcategory text, emoji text, image text,
  tags text[], vibes text[], rating numeric, review_count integer,
  price numeric, original_price numeric, retailer_id text, discount_pct integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with best as (
    select distinct on (o.product_id)
           o.product_id, o.price, o.original_price, o.retailer_id,
           case when o.original_price > o.price then round(((o.original_price - o.price)::numeric / o.original_price) * 100)::int else 0 end as pct
      from public.offers o
      join public.retailers r on r.id = o.retailer_id and r.active
     where o.in_stock and o.price > 0
     -- The best deal on a product: biggest discount first, cheapest as the tie-break.
     order by o.product_id, (case when o.original_price > o.price then o.original_price - o.price else 0 end) desc, o.price
  )
  select p.slug, p.name, p.brand, p.brand_id, p.category_id, p.subcategory, p.emoji, p.image,
         p.tags, p.vibes, p.rating, p.review_count,
         b.price, b.original_price, b.retailer_id, b.pct
    from public.products p
    join best b on b.product_id = p.id
   where p.published and p.price_tracked
   order by b.pct desc, p.trending desc, p.sort, p.created_at
   limit greatest(1, least(coalesce(want, 24), 48));
$$;
revoke execute on function public.public_deals(integer) from public;
grant execute on function public.public_deals(integer) to anon, authenticated;

/**
 * Brands with something on sale. The front page groups public_deals() itself, so this is here for anything that
 * wants the whole picture (all brands on sale, not only those in today's 24).
 */
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
revoke execute on function public.public_brand_deals(integer) from public;
grant execute on function public.public_brand_deals(integer) to anon, authenticated;
