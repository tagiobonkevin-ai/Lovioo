-- Rollback for migrations/20261031000100_product_teaser.sql. Not applied automatically.
-- Apply only after the app no longer calls product_teaser() (or the home page falls back to an empty teaser).
drop function if exists public.product_teaser();
