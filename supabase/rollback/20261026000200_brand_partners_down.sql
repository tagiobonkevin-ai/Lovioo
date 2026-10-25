-- Rollback for migrations/20261026000200_brand_partners.sql. Not applied automatically.
begin;
drop index if exists public.products_brand_id_idx;
alter table public.products drop column if exists brand_id;
drop table if exists public.brands;
commit;
