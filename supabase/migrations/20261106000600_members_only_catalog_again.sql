-- Products, store offers and price history are for signed-in accounts again (the owner's call: the full catalogue
-- once shoppers log in). Guests keep the home page preview through public_deals() and product_teaser().
-- Non-destructive (ALTER POLICY only). Rollback: supabase/rollback/20261106000600_members_only_catalog_again_down.sql

alter policy "products read" on public.products
  to authenticated
  using (published or (select public.is_editor()));

alter policy "offers read" on public.offers
  to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_editor()))));

alter policy "history read" on public.price_history
  to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_editor()))));
