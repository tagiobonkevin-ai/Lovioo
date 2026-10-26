-- Rollback for migrations/20261031000200_members_only_catalog.sql. Not applied automatically.
-- Makes published products, offers and price history readable by guests again.

alter policy "products read" on public.products
  to anon, authenticated
  using (published or (select public.is_editor()));

alter policy "offers read" on public.offers
  to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_editor()))));

alter policy "history read" on public.price_history
  to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_editor()))));
