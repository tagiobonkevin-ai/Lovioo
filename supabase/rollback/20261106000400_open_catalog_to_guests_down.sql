-- Rollback for migrations/20261106000400_open_catalog_to_guests.sql: products, offers and price history for
-- signed-in accounts only again. Not run automatically.

alter policy "products read" on public.products
  to authenticated
  using (published or (select public.is_editor()));

alter policy "offers read" on public.offers
  to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_editor()))));

alter policy "history read" on public.price_history
  to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_editor()))));
