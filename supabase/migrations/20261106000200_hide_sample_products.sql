-- The launch catalogue is the owner's own imported products. The 129 seed samples are copied to a private
-- backup schema (not exposed to the API) and unpublished, so shoppers only see real products. Nothing is deleted.
create schema if not exists backup;
revoke all on schema backup from public, anon, authenticated;
create table if not exists backup.products_20261029 as select * from public.products where id !~ '^p_[0-9a-f]+$';
create table if not exists backup.offers_20261029 as select o.* from public.offers o where o.product_id in (select id from backup.products_20261029);
create table if not exists backup.price_history_20261029 as select h.* from public.price_history h where h.product_id in (select id from backup.products_20261029);
create table if not exists backup.saved_items_20261029 as select s.* from public.saved_items s where s.product_id in (select id from backup.products_20261029);
create table if not exists backup.swipes_20261029 as select s.* from public.swipes s where s.product_id in (select id from backup.products_20261029);
create table if not exists backup.price_alerts_20261029 as select a.* from public.price_alerts a where a.product_id in (select id from backup.products_20261029);
create table if not exists backup.product_events_20261029 as select e.* from public.product_events e where e.product_id in (select id from backup.products_20261029);
create table if not exists backup.product_change_requests_20261029 as select r.* from public.product_change_requests r where r.product_id in (select id from backup.products_20261029);

update public.products set published = false
where id in (select id from backup.products_20261029) and id not in ('p_fe1feac24b', 'p_90a0f7173b');
