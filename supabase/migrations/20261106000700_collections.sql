-- Admin-managed collections for the home page and Brand Crush: Crush Stories, the Brand Crush row and the
-- "Today's Finds" section. Two NEW tables and one function; no existing table changes. Admins (public.is_admin())
-- write; everyone reads published collections; members read their items; guests get a preview through
-- public_collections(), like public_deals().
-- Rollback: supabase/rollback/20261106000700_collections_down.sql

create table public.collections (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 80),
  tagline text not null default '' check (char_length(tagline) <= 140),
  eyebrow text not null default '' check (char_length(eyebrow) <= 40),
  description text not null default '' check (char_length(description) <= 600),
  emoji text not null default '💘' check (char_length(emoji) <= 8),
  cover_url text not null default '' check (cover_url = '' or cover_url ~* '^https://'),
  in_stories boolean not null default false,
  in_brand_crush boolean not null default false,
  in_todays_finds boolean not null default false,
  published boolean not null default false,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null default auth.uid()
);
comment on table public.collections is 'Curated product collections managed in Admin -> Collections.';

create table public.collection_items (
  collection_id text not null references public.collections (id) on update cascade on delete cascade,
  product_id text not null references public.products (id) on update cascade on delete cascade,
  sort integer not null default 0,
  primary key (collection_id, product_id)
);
create index collection_items_product_idx on public.collection_items (product_id);

create trigger collections_updated_at before update on public.collections
  for each row execute function public.set_updated_at();

alter table public.collections enable row level security;
create policy "collections read" on public.collections for select to anon, authenticated
  using (published or (select public.is_admin()));
create policy "collections admin insert" on public.collections for insert to authenticated
  with check ((select public.is_admin()));
create policy "collections admin update" on public.collections for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "collections admin delete" on public.collections for delete to authenticated
  using ((select public.is_admin()));

alter table public.collection_items enable row level security;
create policy "collection items read" on public.collection_items for select to authenticated
  using (exists (select 1 from public.collections c where c.id = collection_id and (c.published or (select public.is_admin()))));
create policy "collection items admin insert" on public.collection_items for insert to authenticated
  with check ((select public.is_admin()));
create policy "collection items admin update" on public.collection_items for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "collection items admin delete" on public.collection_items for delete to authenticated
  using ((select public.is_admin()));

/**
 * The home page preview of published collections, for guests: up to 12 published products each with name, brand,
 * photo and category, and price/store only when the price is verified. The catalogue itself stays members-only.
 */
create or replace function public.public_collections()
returns table (
  id text, title text, tagline text, eyebrow text, description text, emoji text, cover_url text,
  in_stories boolean, in_brand_crush boolean, in_todays_finds boolean, sort integer, items jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with best as (
    select distinct on (o.product_id) o.product_id, o.price, o.original_price, o.retailer_id
      from public.offers o
      join public.retailers r on r.id = o.retailer_id and r.active
     where o.in_stock and o.price > 0
     order by o.product_id, o.price
  )
  select c.id, c.title, c.tagline, c.eyebrow, c.description, c.emoji, c.cover_url,
         c.in_stories, c.in_brand_crush, c.in_todays_finds, c.sort,
         coalesce((
           select jsonb_agg(x.item order by x.sort)
             from (
               select ci.sort,
                      jsonb_build_object(
                        'slug', p.slug, 'name', p.name, 'brand', p.brand, 'brand_id', p.brand_id,
                        'category_id', p.category_id, 'image', p.image, 'emoji', p.emoji,
                        'trending', p.trending, 'is_new', p.is_new,
                        'price', case when p.price_tracked then b.price end,
                        'original_price', case when p.price_tracked then b.original_price end,
                        'retailer_id', b.retailer_id
                      ) as item
                 from public.collection_items ci
                 join public.products p on p.id = ci.product_id and p.published
                 left join best b on b.product_id = p.id
                where ci.collection_id = c.id
                order by ci.sort
                limit 12
             ) x
         ), '[]'::jsonb) as items
    from public.collections c
   where c.published
   order by c.sort, c.created_at;
$$;
revoke execute on function public.public_collections() from public;
grant execute on function public.public_collections() to anon, authenticated;

-- Starter collections, so the home page looks the same on day one and the team edits rather than starts empty.
insert into public.collections (id, title, tagline, eyebrow, description, emoji, cover_url, in_stories, in_brand_crush, in_todays_finds, published, sort) values
  ('todays-finds', 'Today''s Finds.', 'Loving It Already.', 'Prices today', 'A taste of today''s finds with verified prices. Join free to see the whole catalogue — trending picks, new arrivals and hidden gems.', '🔥', '', true, false, true, true, 0),
  ('gadget-crush', 'Gadget Crush', 'Tech worth getting excited about.', 'Brand Crush', 'Gadgets and electronics worth getting excited about.', '🎧', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=640&h=800&q=75', true, true, false, true, 1),
  ('style-crush', 'Style Crush', 'Fashion, beauty and personal style.', 'Brand Crush', 'Fashion, accessories and beauty finds to make your look yours.', '👟', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=640&h=800&q=75', true, true, false, true, 2),
  ('beauty-crush', 'Beauty Crush', 'Your next beauty obsession.', 'Brand Crush', 'Skincare and beauty finds for your next obsession.', '💄', 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=640&h=800&q=75', true, true, false, true, 3),
  ('home-crush', 'Home Crush', 'Little upgrades, better living.', 'Brand Crush', 'Home and lifestyle finds — little upgrades for better living.', '🛋️', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=640&h=800&q=75', true, true, false, true, 4),
  ('daily-crush', 'Daily Crush', 'Your daily dose of inspiration.', 'Brand Crush', 'A fresh set of finds, picked by the Lovioo team.', '☀️', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=640&h=800&q=75', true, true, false, true, 5),
  ('budget-crush', 'Budget Crush', 'Amazing discoveries within your budget.', 'Brand Crush', 'Great finds at ₱1,000 or less.', '🪙', 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=640&h=800&q=75', true, true, false, true, 6)
on conflict (id) do nothing;

-- Fill them with what matches today: published products, photographed ones first.
insert into public.collection_items (collection_id, product_id, sort)
select 'todays-finds', p.id, row_number() over (order by p.sort, p.created_at) from public.products p where p.published and p.price_tracked
on conflict do nothing;
insert into public.collection_items (collection_id, product_id, sort)
select c.id, p.id, row_number() over (partition by c.id order by p.sort, p.created_at)
  from public.products p
  join (values ('gadget-crush', array['electronics','gaming']), ('style-crush', array['fashion','beauty']), ('beauty-crush', array['beauty']),
               ('home-crush', array['home'])) as c(id, cats) on p.category_id = any (c.cats)
 where p.published
on conflict do nothing;
insert into public.collection_items (collection_id, product_id, sort)
select 'daily-crush', p.id, row_number() over (order by p.sort, p.created_at) from public.products p where p.published and p.image <> ''
on conflict do nothing;
insert into public.collection_items (collection_id, product_id, sort)
select 'budget-crush', p.id, row_number() over (order by min(o.price)) from public.products p join public.offers o on o.product_id = p.id
 where p.published and p.price_tracked group by p.id having min(o.price) <= 1000
on conflict do nothing;
