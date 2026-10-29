-- Rollback for 20261106000100_fix_imported_product_brands.sql: restores the previous brand values.
-- Not run automatically. The two brand rows are left in place (removing them is a delete; do it by hand if wanted).
update public.products
  set brand = 'Health & Personal Care icon arrow right Suncare icon arrow right Face', brand_id = null
  where id = 'p_fe1feac24b';
update public.products set brand = 'Beauty of Joseon', brand_id = 'beauty-of-joseon' where id = 'p_90a0f7173b';
