-- Rollback for migrations/20261106000600_members_only_catalog_again.sql: guests may browse published products again.
-- Not run automatically.

alter policy "products read" on public.products
  to anon, authenticated
  using (published or (select public.is_editor()));

alter policy "offers read" on public.offers
  to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_editor()))));

alter policy "history read" on public.price_history
  to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_editor()))));
