-- Phase 2 catalog-review tests (run AFTER migration 20261027000100). Everything runs in ONE transaction that ends with a
-- deliberate error, so it is all rolled back. The error message lists each check with its expected result in brackets.
begin;
create function pg_temp.as_user(who uuid) returns void language plpgsql as $f$
begin
  if who is null then perform set_config('request.jwt.claims', '{"role":"anon"}', true); execute 'set local role anon';
  else perform set_config('request.jwt.claims', json_build_object('sub', who, 'role', 'authenticated')::text, true); execute 'set local role authenticated'; end if;
end $f$;
create function pg_temp.x(who uuid, q text) returns text language plpgsql as $f$
declare n int;
begin
  begin perform pg_temp.as_user(who); execute q; get diagnostics n = row_count; execute 'reset role'; return 'ok:' || n;
  exception when others then execute 'reset role'; return 'ERR:' || left(sqlerrm, 70); end;
end $f$;
create function pg_temp.c(who uuid, q text) returns text language plpgsql as $f$
declare n bigint;
begin
  begin perform pg_temp.as_user(who); execute 'select count(*) from (' || q || ') s' into n; execute 'reset role'; return 'n=' || n;
  exception when others then execute 'reset role'; return 'ERR:' || left(sqlerrm, 70); end;
end $f$;
do $t$
declare
  sup uuid := (select id from auth.users where email = 'kevin@cleons.net');
  cust uuid := gen_random_uuid(); ed uuid := gen_random_uuid(); adm uuid := gen_random_uuid();
  out text := E'\n';
  pub text := (select p.id from public.products p join public.offers o on o.product_id = p.id and o.retailer_id = 'shopee' where p.published and p.price_tracked limit 1);
  pick text := (select id from public.products where published and not price_tracked limit 1);
  req1 bigint; req2 bigint;
begin
  insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at) values
    (cust, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p2-cust@test.lovioo', now(), '{}', now(), now()),
    (ed,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p2-ed@test.lovioo', now(), '{}', now(), now()),
    (adm,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p2-adm@test.lovioo', now(), '{}', now(), now());
  update public.profiles set role = 'editor' where id = ed;
  update public.profiles set role = 'admin' where id = adm;

  out := out || 'E1 live price change ' || pg_temp.x(ed, format('update public.offers set price = price + 1, shipping = 0, in_stock = true where product_id = %L and retailer_id = ''shopee''', pub)) || E' (ok:1)\n';
  out := out || 'E2 live price upsert ' || pg_temp.x(ed, format('insert into public.offers (product_id, retailer_id, price, original_price, shipping, in_stock, url) select product_id, retailer_id, price + 1, original_price + 1, shipping, in_stock, url from public.offers where product_id = %L and retailer_id = ''shopee'' on conflict (product_id, retailer_id) do update set price = excluded.price, original_price = excluded.original_price', pub)) || E' (ok:1)\n';
  out := out || 'E3 live name change ' || pg_temp.x(ed, format('update public.products set name = name || ''!'' where id = %L', pub)) || E' (ERR live)\n';
  out := out || 'E4 live image change ' || pg_temp.x(ed, format('update public.products set image = '''' where id = %L', pub)) || E' (ERR live)\n';
  out := out || 'E5 live store link change ' || pg_temp.x(ed, format('update public.offers set url = ''https://evil.example/x'' where product_id = %L and retailer_id = ''shopee''', pub)) || E' (ERR links)\n';
  out := out || 'E6 live remove store ' || pg_temp.x(ed, format('delete from public.offers where product_id = %L and retailer_id = ''shopee''', pub)) || E' (ERR removing)\n';
  out := out || 'E7 live add store ' || pg_temp.x(ed, format('insert into public.offers (product_id, retailer_id, price, original_price) values (%L, ''shein'', 10, 10)', pub)) || E' (ERR adding)\n';
  out := out || 'E8 pick price_tracked ' || pg_temp.x(ed, format('update public.products set price_tracked = price_tracked where id = %L', pick)) || E' (ok:1)\n';
  out := out || 'E9 request change ' || pg_temp.x(ed, format('insert into public.product_change_requests (product_id, requested_by, changes, note) values (%L, %L, ''{"product":{"name":"Renamed by review"},"offers":{"shopee":{"url":"https://s.shopee.ph/abc"}}}'', ''new name'')', pub, ed)) || E' (ok:1)\n';
  out := out || 'E10 request for someone else ' || pg_temp.x(ed, format('insert into public.product_change_requests (product_id, requested_by, changes) values (%L, %L, ''{"product":{"name":"x"}}'')', pub, adm)) || E' (ERR)\n';
  out := out || 'E11 request pre-approved ' || pg_temp.x(ed, format('insert into public.product_change_requests (product_id, requested_by, changes, status) values (%L, %L, ''{"product":{"name":"x"}}'', ''approved'')', pub, ed)) || E' (ERR)\n';
  out := out || 'E12 own requests ' || pg_temp.c(ed, 'select 1 from public.product_change_requests') || E' (n=1)\n';
  select id into req1 from public.product_change_requests where requested_by = ed;
  out := out || 'E13 stamped email ' || coalesce((select requested_by_email from public.product_change_requests where id = req1), 'null') || E' (p2-ed@test.lovioo)\n';
  out := out || 'E14 editor approves ' || pg_temp.x(ed, format('select public.approve_product_change(%s)', req1)) || E' (ERR)\n';
  out := out || 'E15 editor edits request ' || pg_temp.x(ed, format('update public.product_change_requests set status = ''approved'' where id = %s', req1)) || E' (ok:0)\n';
  out := out || 'C1 customer requests ' || pg_temp.x(cust, format('insert into public.product_change_requests (product_id, requested_by, changes) values (%L, %L, ''{"product":{"name":"x"}}'')', pub, cust)) || E' (ERR)\n';
  out := out || 'C2 customer reads ' || pg_temp.c(cust, 'select 1 from public.product_change_requests') || E' (n=0)\n';
  out := out || 'C3 customer rejects ' || pg_temp.x(cust, format('select public.reject_product_change(%s, ''no'')', req1)) || E' (ERR)\n';
  out := out || 'N1 anon approves ' || pg_temp.x(null, format('select public.approve_product_change(%s)', req1)) || E' (ERR)\n';
  out := out || 'A1 admin reads ' || pg_temp.c(adm, 'select 1 from public.product_change_requests') || E' (n=1)\n';
  out := out || 'A2 admin approves ' || pg_temp.x(adm, format('select public.approve_product_change(%s)', req1)) || E' (ok:1)\n';
  out := out || 'A3 applied name ' || (select name from public.products where id = pub) || E' (Renamed by review)\n';
  out := out || 'A4 applied link ' || (select url from public.offers where product_id = pub and retailer_id = 'shopee') || E' (https://s.shopee.ph/abc)\n';
  out := out || 'A5 status ' || (select status || ' by ' || coalesce(reviewed_by_email, '?') from public.product_change_requests where id = req1) || E' (approved by p2-adm@test.lovioo)\n';
  out := out || 'A6 approve twice ' || pg_temp.x(adm, format('select public.approve_product_change(%s)', req1)) || E' (ERR no longer pending)\n';
  perform pg_temp.x(ed, format('insert into public.product_change_requests (product_id, requested_by, changes) values (%L, %L, ''{"product":{"description":"x"}}'')', pub, ed));
  select max(id) into req2 from public.product_change_requests where requested_by = ed;
  out := out || 'A7 admin sends back ' || pg_temp.x(adm, format('select public.reject_product_change(%s, ''Please add a source'')', req2)) || E' (ok:1)\n';
  out := out || 'A8 editor sees note ' || pg_temp.c(ed, format('select 1 from public.product_change_requests where id = %s and status = ''rejected'' and review_note = ''Please add a source''', req2)) || E' (n=1)\n';
  out := out || 'L1 http image ' || pg_temp.x(adm, format('update public.products set image = ''http://x.example/a.jpg'' where id = %L', pub)) || E' (ERR check)\n';
  out := out || 'L2 javascript link ' || pg_temp.x(adm, format('update public.offers set url = ''javascript:alert(1)'' where product_id = %L and retailer_id = ''shopee''', pub)) || E' (ERR check)\n';
  out := out || 'L3 http homepage ' || pg_temp.x(adm, 'update public.retailers set homepage = ''http://shopee.ph'' where id = ''shopee''') || E' (ERR check)\n';
  out := out || 'D1 editor draft ' || pg_temp.x(ed, 'insert into public.products (id, slug, name, brand, category_id) values (''p2-d'', ''p2-d'', ''Draft'', ''X'', ''home'')') || E' (ok:1)\n';
  out := out || 'D2 editor edits draft ' || pg_temp.x(ed, 'update public.products set name = ''Draft 2'', image = '''' where id = ''p2-d''') || E' (ok:1)\n';
  out := out || 'D3 editor adds store to draft ' || pg_temp.x(ed, 'insert into public.offers (product_id, retailer_id, price, original_price) values (''p2-d'', ''lazada'', 50, 60)') || E' (ok:1)\n';
  out := out || 'D4 submit for review ' || pg_temp.x(ed, format('update public.products set review_requested_at = now(), review_requested_by = %L where id = ''p2-d''', ed)) || E' (ok:1)\n';
  out := out || 'D5 admin publishes ' || pg_temp.x(adm, 'update public.products set published = true where id = ''p2-d''') || E' (ok:1)\n';
  out := out || 'D6 submission cleared ' || (select coalesce(review_requested_at::text, 'cleared') from public.products where id = 'p2-d') || E' (cleared)\n';
  out := out || 'D7 now live, editor rename ' || pg_temp.x(ed, 'update public.products set name = ''Draft 3'' where id = ''p2-d''') || E' (ERR live)\n';
  raise exception 'PHASE2 TEST RESULTS (rolled back):%', out;
end $t$;
