-- Rollback for 20261106001100_product_details.sql. Removes the reviews table and the new columns (and their data),
-- and puts the three functions back to their previous versions (20261103000100 / 20261106001000).
drop table if exists public.product_reviews;
drop function if exists public.stamp_review();
alter table public.offers drop column if exists price_max;
alter table public.products drop column if exists rating_source;
alter table public.products drop column if exists promotions;
alter table public.products drop column if exists colors;
drop function if exists public.valid_product_promotions(jsonb);
drop function if exists public.valid_product_colors(jsonb);
-- Then re-run the guard_live_product_edit and approve_product_change definitions from
-- supabase/migrations/20261103000100_product_gallery.sql, and guard_partner_fields from
-- supabase/migrations/20261106001000_brand_partners_portal.sql.
