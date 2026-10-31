-- The brand brief's 8 shopping categories. Renames and inserts only: Toys & Hobbies and Family & Pets are kept
-- (the app hides a category while it has no live products).
-- Rollback: supabase/rollback/20261106000500_brand_brief_categories_down.sql
update public.categories set name = 'Gadgets & Electronics', sort = 0 where id = 'electronics';
update public.categories set name = 'Fashion & Accessories', sort = 1 where id = 'fashion';
update public.categories set name = 'Beauty & Skincare', sort = 2 where id = 'beauty';
update public.categories set name = 'Home & Lifestyle', sort = 3 where id = 'home';
update public.categories set name = 'Sports & Fitness', sort = 5 where id = 'sports';
update public.categories set sort = 8 where id = 'toys';
update public.categories set sort = 9 where id = 'family';
insert into public.categories (id, name, emoji, tint, sort) values
  ('gaming', 'Gaming', '🎮', '#FFE8F1', 4),
  ('baby-kids', 'Baby & Kids', '🧸', '#FFE8F1', 6),
  ('essentials', 'Everyday Essentials', '🧴', '#FFE8F1', 7)
on conflict (id) do nothing;
