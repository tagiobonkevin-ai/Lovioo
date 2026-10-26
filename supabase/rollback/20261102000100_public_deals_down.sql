-- Rollback for migrations/20261102000100_public_deals.sql. Not applied automatically.
-- Apply only once the front page no longer calls these (it then shows no deals to guests).
drop function if exists public.public_brand_deals(integer);
drop function if exists public.public_deals(integer);
