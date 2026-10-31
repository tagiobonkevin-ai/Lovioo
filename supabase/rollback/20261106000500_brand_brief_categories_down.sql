-- Rollback for migrations/20261106000500_brand_brief_categories.sql: the earlier names and order. Not run
-- automatically. The three new categories are left in place (removing them is a delete; reassign their products
-- first if you do it by hand).
update public.categories set name = 'Electronics', sort = 0 where id = 'electronics';
update public.categories set name = 'Fashion', sort = 1 where id = 'fashion';
update public.categories set name = 'Beauty & Skincare', sort = 2 where id = 'beauty';
update public.categories set name = 'Home & Living', sort = 3 where id = 'home';
update public.categories set name = 'Sports & Outdoors', sort = 4 where id = 'sports';
update public.categories set sort = 5 where id = 'toys';
update public.categories set sort = 6 where id = 'family';
