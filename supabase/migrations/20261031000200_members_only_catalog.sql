-- Products, store offers (prices) and price history are for signed-in accounts only. Guests see the home page teaser
-- (product_teaser()) and are asked to create an account. Categories, retailers and brands stay public: they hold no
-- products or prices. product_price_stats is security_invoker, so it follows these rules automatically.
-- Apply AFTER the app that loads products in the browser with the user's session is live.
-- Non-destructive (ALTER POLICY only). Rollback: supabase/rollback/20261031000200_members_only_catalog_down.sql

alter policy "products read" on public.products
  to authenticated
  using (published or (select public.is_editor()));

alter policy "offers read" on public.offers
  to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_editor()))));

alter policy "history read" on public.price_history
  to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_editor()))));
