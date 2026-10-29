-- Rollback for 20261106000200_hide_sample_products.sql: publishes the seed samples again.
-- Not run automatically. The backup schema is left in place (drop it by hand once it's no longer wanted).
update public.products set published = true where id in (select id from backup.products_20261029);
