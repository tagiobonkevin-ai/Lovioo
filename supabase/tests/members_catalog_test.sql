-- Members-only catalog tests (run AFTER migrations 20261031000100 and 20261031000200). Everything runs in ONE transaction
-- that ends with a deliberate error, so it is all rolled back. The error lists each check with its expected result in brackets.
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
  cust uuid := gen_random_uuid(); ed uuid := gen_random_uuid();
  pub text := (select p.id from public.products p join public.offers o on o.product_id = p.id where p.published limit 1);
  n_pub bigint := (select count(*) from public.products where published);
  n_all bigint := (select count(*) from public.products) + 1;
  out text := E'\n';
begin
  insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at) values
    (cust, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mo-cust@test.lovioo', now(), '{}', now(), now()),
    (ed,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mo-ed@test.lovioo', now(), '{}', now(), now());
  update public.profiles set role = 'editor' where id = ed;
  insert into public.products (id, slug, name, brand, category_id, published) values ('mo-draft', 'mo-draft', 'Members draft', 'Test', 'home', false);

  out := out || 'G1 guest products ' || pg_temp.c(null, 'select 1 from public.products') || E' (n=0)\n';
  out := out || 'G2 guest offers ' || pg_temp.c(null, 'select 1 from public.offers') || E' (n=0)\n';
  out := out || 'G3 guest history ' || pg_temp.c(null, 'select 1 from public.price_history') || E' (n=0)\n';
  out := out || 'G4 guest price stats ' || pg_temp.c(null, 'select 1 from public.product_price_stats') || E' (n=0)\n';
  out := out || 'G5 guest teaser ' || pg_temp.c(null, 'select * from public.product_teaser()') || E' (n=40)\n';
  out := out || 'G6 teaser columns ' || (select array_to_string(proargnames, ',') from pg_proc where proname = 'product_teaser') || E' (name,brand,image,emoji,category_id)\n';
  out := out || 'G7 guest categories ' || pg_temp.c(null, 'select 1 from public.categories') || E' (n>0)\n';
  out := out || 'G8 guest retailers ' || pg_temp.c(null, 'select 1 from public.retailers') || E' (n>0)\n';
  out := out || 'G9 guest brands ' || pg_temp.c(null, 'select 1 from public.brands where published') || E' (n>0)\n';
  out := out || 'C1 customer products ' || pg_temp.c(cust, 'select 1 from public.products') || ' (n=' || n_pub || E')\n';
  out := out || 'C2 customer offers of one product ' || pg_temp.c(cust, format('select 1 from public.offers where product_id = %L', pub)) || E' (n>0)\n';
  out := out || 'C3 customer sees draft ' || pg_temp.c(cust, 'select 1 from public.products where id = ''mo-draft''') || E' (n=0)\n';
  out := out || 'C4 customer price stats ' || pg_temp.c(cust, 'select 1 from public.product_price_stats') || E' (n>0)\n';
  out := out || 'C5 customer teaser ' || pg_temp.c(cust, 'select * from public.product_teaser()') || E' (n=40)\n';
  out := out || 'E1 editor sees draft ' || pg_temp.c(ed, 'select 1 from public.products where id = ''mo-draft''') || E' (n=1)\n';
  out := out || 'E2 editor products ' || pg_temp.c(ed, 'select 1 from public.products') || ' (n=' || n_all || E')\n';
  out := out || 'X1 teaser shows draft ' || (select count(*) from public.product_teaser() t where t.name = 'Members draft') || E' (0)\n';
  raise exception 'MEMBERS CATALOG TEST RESULTS (rolled back):%', out;
end $t$;
