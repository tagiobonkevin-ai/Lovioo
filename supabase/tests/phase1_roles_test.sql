-- Phase 1 role tests (run AFTER migrations 20261026000100 and 20261026000200 are applied).
-- Runs every check in ONE transaction, then raises an error on purpose so EVERYTHING is rolled back,
-- including the temporary test users. Paste into Supabase > SQL Editor > Run; the error message
-- "PHASE1 TEST RESULTS (rolled back): ..." lists each check with its expected result in brackets.

begin;
create function pg_temp.as_user(who uuid) returns void language plpgsql as $f$
begin
  if who is null then
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    execute 'set local role anon';
  else
    perform set_config('request.jwt.claims', json_build_object('sub', who, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
  end if;
end $f$;

create function pg_temp.x(who uuid, q text) returns text language plpgsql as $f$
declare n int;
begin
  begin
    perform pg_temp.as_user(who);
    execute q;
    get diagnostics n = row_count;
    execute 'reset role';
    return 'ok:' || n;
  exception when others then
    execute 'reset role';
    return 'ERR:' || left(sqlerrm, 60);
  end;
end $f$;

create function pg_temp.c(who uuid, q text) returns text language plpgsql as $f$
declare n bigint;
begin
  begin
    perform pg_temp.as_user(who);
    execute 'select count(*) from (' || q || ') s' into n;
    execute 'reset role';
    return 'n=' || n;
  exception when others then
    execute 'reset role';
    return 'ERR:' || left(sqlerrm, 60);
  end;
end $f$;

create function pg_temp.v(who uuid, q text) returns text language plpgsql as $f$
declare t text;
begin
  begin
    perform pg_temp.as_user(who);
    execute q into t;
    execute 'reset role';
    return coalesce(t, 'null');
  exception when others then
    execute 'reset role';
    return 'ERR:' || left(sqlerrm, 60);
  end;
end $f$;

do $t$
declare
  sup uuid := (select id from auth.users where email = 'kevin@cleons.net');
  cust uuid := gen_random_uuid();
  ed uuid := gen_random_uuid();
  adm uuid := gen_random_uuid();
  uned uuid := gen_random_uuid();
  out text := E'\n';
  pid text;
  pub text := (select id from public.products where published limit 1);
  r text;
  procedure_line text;
begin
  insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at) values
    (cust, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1-cust@test.lovioo', now(), '{"full_name":"Cust"}', now(), now()),
    (ed,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1-ed@test.lovioo', now(), '{"full_name":"Ed"}', now(), now()),
    (adm,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1-adm@test.lovioo', now(), '{"full_name":"Adm"}', now(), now()),
    (uned, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p1-uned@test.lovioo', null, '{"full_name":"Uned"}', now(), now());
  update public.profiles set role = 'editor' where id in (ed, uned);
  update public.profiles set role = 'admin' where id = adm;
  insert into public.saved_items (user_id, product_id) values (sup, pub) on conflict do nothing;

  out := out || 'backfill kevin role=' || (select role::text from public.profiles where id = sup) || E'\n';

  -- customer
  out := out || 'C1 own profile ' || pg_temp.c(cust, format('select 1 from public.profiles where id = %L', cust)) || E' (n=1)\n';
  out := out || 'C2 other profile ' || pg_temp.c(cust, format('select 1 from public.profiles where id = %L', sup)) || E' (n=0)\n';
  out := out || 'C3 set own role ' || pg_temp.x(cust, format('update public.profiles set role = ''super_admin'' where id = %L', cust)) || E' (ERR)\n';
  out := out || 'C4 set own email ' || pg_temp.x(cust, format('update public.profiles set email = ''x@y.z'' where id = %L', cust)) || E' (ERR)\n';
  out := out || 'C5 set own prefs ' || pg_temp.x(cust, format('update public.profiles set full_name = ''C'', onboarded = true, streak = 2 where id = %L', cust)) || E' (ok:1)\n';
  out := out || 'C6 insert product ' || pg_temp.x(cust, 'insert into public.products (slug, name, brand, category_id) values (''p1-c'', ''X'', ''X'', ''home'')') || E' (ERR)\n';
  out := out || 'C7 update products ' || pg_temp.x(cust, 'update public.products set name = name') || E' (ok:0)\n';
  out := out || 'C8 insert offer ' || pg_temp.x(cust, format('insert into public.offers (product_id, retailer_id, price, original_price) values (%L, ''ebay'', 1, 1)', pub)) || E' (ERR)\n';
  out := out || 'C9 update retailers ' || pg_temp.x(cust, 'update public.retailers set name = name') || E' (ok:0)\n';
  out := out || 'C10 others saved ' || pg_temp.c(cust, format('select 1 from public.saved_items where user_id = %L', sup)) || E' (n=0)\n';
  out := out || 'C11 admin_overview ' || pg_temp.v(cust, 'select public.admin_overview(7)::text') || E' (ERR)\n';
  out := out || 'C12 set_user_role ' || pg_temp.v(cust, format('select public.set_user_role(%L, ''admin'')::text', cust)) || E' (ERR)\n';
  out := out || 'C13 insert admins ' || pg_temp.x(cust, 'insert into public.admins (email) values (''p1-cust@test.lovioo'')') || E' (ERR)\n';
  out := out || 'C14 role ' || pg_temp.v(cust, 'select public.current_app_role()::text') || E' (customer)\n';
  out := out || 'C15 list_team ' || pg_temp.c(cust, 'select * from public.list_team()') || E' (ERR)\n';
  out := out || 'C16 unpublished visible ' || pg_temp.c(cust, 'select 1 from public.products where not published') || E' (n=0)\n';

  -- editor
  out := out || 'E1 role ' || pg_temp.v(ed, 'select public.current_app_role()::text') || E' (editor)\n';
  out := out || 'E2 insert product published ' || pg_temp.x(ed, 'insert into public.products (id, slug, name, brand, category_id, published) values (''p1-ed'', ''p1-ed'', ''Ed draft'', ''X'', ''home'', true)') || E' (ok:1)\n';
  out := out || 'E3 forced draft published=' || (select published::text from public.products where id = 'p1-ed') || E' (false)\n';
  out := out || 'E4 edit draft ' || pg_temp.x(ed, 'update public.products set name = ''Ed draft 2'' where id = ''p1-ed''') || E' (ok:1)\n';
  out := out || 'E5 publish ' || pg_temp.x(ed, 'update public.products set published = true where id = ''p1-ed''') || E' (ERR only admins)\n';
  out := out || 'E6 unpublish live ' || pg_temp.x(ed, format('update public.products set published = false where id = %L', pub)) || E' (ERR only admins)\n';
  out := out || 'E7 edit live product text ' || pg_temp.x(ed, format('update public.products set description = description where id = %L', pub)) || E' (ok:1)\n';
  out := out || 'E8 delete product ' || pg_temp.x(ed, 'delete from public.products where id = ''p1-ed''') || E' (ok:0)\n';
  out := out || 'E9 add offer ' || pg_temp.x(ed, 'insert into public.offers (product_id, retailer_id, price, original_price) values (''p1-ed'', ''shopee'', 100, 120)') || E' (ok:1)\n';
  out := out || 'E10 edit offer ' || pg_temp.x(ed, 'update public.offers set price = 90 where product_id = ''p1-ed''') || E' (ok:1)\n';
  out := out || 'E11 see drafts ' || pg_temp.c(ed, 'select 1 from public.products where not published') || E' (n>0)\n';
  out := out || 'E12 see draft offer ' || pg_temp.c(ed, 'select 1 from public.offers where product_id = ''p1-ed''') || E' (n=1)\n';
  out := out || 'E13 retailers ' || pg_temp.x(ed, 'update public.retailers set affiliate_url = null') || E' (ok:0)\n';
  out := out || 'E14 categories ' || pg_temp.x(ed, 'update public.categories set name = name') || E' (ok:0)\n';
  out := out || 'E15 admin_overview ' || pg_temp.v(ed, 'select public.admin_overview(7)::text is not null') || E' (ERR)\n';
  out := out || 'E16 set_user_role ' || pg_temp.v(ed, format('select public.set_user_role(%L, ''admin'')::text', ed)) || E' (ERR)\n';
  out := out || 'E17 feedback read ' || pg_temp.c(ed, 'select 1 from public.feedback') || E' (n=0)\n';
  out := out || 'E18 others profiles ' || pg_temp.c(ed, format('select 1 from public.profiles where id <> %L', ed)) || E' (n=0)\n';
  out := out || 'E19 history write ' || pg_temp.x(ed, 'insert into public.price_history (product_id, retailer_id, day, price) values (''p1-ed'', ''lazada'', current_date, 5)') || E' (ERR)\n';
  out := out || 'E20 unconfirmed editor role ' || pg_temp.v(uned, 'select public.current_app_role()::text') || E' (customer)\n';
  out := out || 'E21 unconfirmed editor insert ' || pg_temp.x(uned, 'insert into public.products (slug, name, brand, category_id) values (''p1-u'', ''X'', ''X'', ''home'')') || E' (ERR)\n';

  -- admin
  out := out || 'A1 publish ' || pg_temp.x(adm, 'update public.products set published = true where id = ''p1-ed''') || E' (ok:1)\n';
  out := out || 'A2 overview ' || pg_temp.v(adm, 'select (public.admin_overview(7) ? ''products'')::text') || E' (true)\n';
  out := out || 'A3 list_team ' || pg_temp.c(adm, 'select * from public.list_team()') || E' (n>=5)\n';
  out := out || 'A4 set_user_role ' || pg_temp.v(adm, format('select public.set_user_role(%L, ''admin'')::text', cust)) || E' (ERR only super)\n';
  out := out || 'A5 retailers ' || pg_temp.x(adm, 'update public.retailers set name = name') || E' (ok:N)\n';
  out := out || 'A6 legacy admins read ' || pg_temp.c(adm, 'select 1 from public.admins') || E' (n=0)\n';
  out := out || 'A7 delete product ' || pg_temp.x(adm, 'delete from public.products where id = ''p1-ed''') || E' (ok:1)\n';
  out := out || 'A8 others profiles ' || pg_temp.c(adm, 'select 1 from public.profiles') || E' (n>=5)\n';

  -- super admin
  out := out || 'S1 role ' || pg_temp.v(sup, 'select public.current_app_role()::text') || E' (super_admin)\n';
  out := out || 'S2 make cust editor ' || pg_temp.v(sup, format('select public.set_user_role(%L, ''editor'')::text', cust)) || E' (ok)\n';
  out := out || 'S3 cust now ' || (select role::text from public.profiles where id = cust) || E' (editor)\n';
  out := out || 'S4 audit rows ' || pg_temp.c(sup, format('select 1 from public.role_changes where user_id = %L and new_role = ''editor''', cust)) || E' (n=1)\n';
  out := out || 'S5 demote last super ' || pg_temp.v(sup, format('select public.set_user_role(%L, ''admin'')::text', sup)) || E' (ERR at least one)\n';
  out := out || 'S6 audit direct write ' || pg_temp.x(sup, format('insert into public.role_changes (user_email, new_role) values (''x'', ''admin'')')) || E' (ERR)\n';
  out := out || 'S7 legacy admins read ' || pg_temp.c(sup, 'select 1 from public.admins') || E' (n=1)\n';
  out := out || 'S8 legacy admins write ' || pg_temp.x(sup, 'insert into public.admins (email) values (''p1@test.lovioo'')') || E' (ERR)\n';

  -- anon
  out := out || 'N1 event backdated ' || pg_temp.x(null, format('insert into public.product_events (product_id, kind, created_at) values (%L, ''view'', ''2000-01-01'')', pub)) || E' (ok:1)\n';
  out := out || 'N2 event created_at forced ' || (select (max(created_at) > now() - interval '1 minute')::text from public.product_events) || E' (true)\n';
  out := out || 'N3 insert product ' || pg_temp.x(null, 'insert into public.products (slug, name, brand, category_id) values (''p1-a'', ''X'', ''X'', ''home'')') || E' (ERR)\n';
  out := out || 'N4 admin_overview ' || pg_temp.v(null, 'select public.admin_overview(7)::text') || E' (ERR)\n';
  out := out || 'N5 list_team ' || pg_temp.c(null, 'select * from public.list_team()') || E' (ERR)\n';
  out := out || 'N6 set_user_role ' || pg_temp.v(null, format('select public.set_user_role(%L, ''admin'')::text', sup)) || E' (ERR)\n';
  out := out || 'N7 role ' || pg_temp.v(null, 'select coalesce(public.current_app_role()::text, ''none'')') || E' (none)\n';
  out := out || 'N8 unpublished ' || pg_temp.c(null, 'select 1 from public.products where not published') || E' (n=0)\n';
  out := out || 'N9 feedback backdated ' || pg_temp.x(null, 'insert into public.feedback (message, created_at) values (''hi'', ''2000-01-01'')') || E' (ok:1)\n';
  out := out || 'N10 feedback created_at forced ' || (select (min(created_at) > now() - interval '1 minute')::text from public.feedback where message = 'hi') || E' (true)\n';

  raise exception 'PHASE1 TEST RESULTS (rolled back):%', out;
end $t$;
