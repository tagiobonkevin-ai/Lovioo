-- Guests can browse: published products, their store offers and price history become readable without an account
-- again (the reverse of 20261031000200_members_only_catalog.sql). Unpublished products stay visible to editors
-- only, and all writes keep their existing rules. Non-destructive (ALTER POLICY only).
-- Rollback: supabase/rollback/20261106000400_open_catalog_to_guests_down.sql

alter policy "products read" on public.products
  to anon, authenticated
  using (published or (select public.is_editor()));

alter policy "offers read" on public.offers
  to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_editor()))));

alter policy "history read" on public.price_history
  to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_editor()))));
