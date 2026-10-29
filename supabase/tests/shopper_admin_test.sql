-- Shopper admin tests (run AFTER migrations 20261105000100 and 20261105000200). Everything runs in ONE transaction that ends with a
-- deliberate error, so it is all rolled back. The error lists each check with its expected result in brackets.
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
  cust uuid := gen_random_uuid(); cust2 uuid := gen_random_uuid(); adm uuid := gen_random_uuid(); ed uuid := gen_random_uuid();
  out text := E'\n';
begin
  insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at) values
    (cust,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa-cust@test.lovioo', now(), '{"full_name":"Maria Santos"}', now(), now()),
    (cust2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa-cust2@test.lovioo', now(), '{"full_name":"Juan Cruz"}', now(), now()),
    (ed,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa-ed@test.lovioo', now(), '{}', now(), now()),
    (adm,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa-adm@test.lovioo', now(), '{}', now(), now());
  update public.profiles set role = 'editor' where id = ed;
  update public.profiles set role = 'admin' where id = adm;

  -- Before approval the shopper owns their name.
  out := out || 'U1 own rename before approval ' || pg_temp.x(cust, format('update public.profiles set full_name = ''Maria S.'' where id = %L', cust)) || E' (ok:1)\n';
  out := out || 'U2 self-approve blocked ' || pg_temp.x(cust, format('update public.profiles set name_approved_at = now() where id = %L', cust)) || E' (ok:1 but ignored)\n';
  out := out || 'U3 still not approved ' || coalesce((select name_approved_at::text from public.profiles where id = cust), 'null') || E' (null)\n';
  out := out || 'U4 customer calls approve ' || pg_temp.x(cust, format('select public.approve_shopper_name(%L)', cust2)) || E' (ERR admins)\n';
  out := out || 'E1 editor calls approve ' || pg_temp.x(ed, format('select public.approve_shopper_name(%L)', cust)) || E' (ERR admins)\n';
  out := out || 'E2 editor deletes ' || pg_temp.x(ed, format('select public.delete_shopper(%L, ''sa-cust@test.lovioo'')', cust)) || E' (ERR admins)\n';

  -- Admin approves, then the name is locked for the shopper.
  out := out || 'A1 admin approves ' || pg_temp.x(adm, format('select public.approve_shopper_name(%L)', cust)) || E' (ok:1)\n';
  out := out || 'A2 approval stamped ' || (select case when name_approved_at is not null and name_approved_by = adm then 'yes' else 'no' end from public.profiles where id = cust) || E' (yes)\n';
  out := out || 'U5 rename after approval ' || pg_temp.x(cust, format('update public.profiles set full_name = ''Someone Else'' where id = %L', cust)) || E' (ERR approved)\n';
  out := out || 'U6 other fields still editable ' || pg_temp.x(cust, format('update public.profiles set city = ''Cebu City'' where id = %L', cust)) || E' (ok:1)\n';
  out := out || 'A3 admin corrects name ' || pg_temp.x(adm, format('select public.admin_set_shopper_name(%L, ''Maria Clara Santos'')', cust)) || E' (ok:1)\n';
  out := out || 'A4 name applied ' || (select full_name from public.profiles where id = cust) || E' (Maria Clara Santos)\n';
  out := out || 'A5 empty name ' || pg_temp.x(adm, format('select public.admin_set_shopper_name(%L, ''   '')', cust)) || E' (ERR 1 to 80)\n';
  out := out || 'A6 admin removes approval ' || pg_temp.x(adm, format('select public.approve_shopper_name(%L, false)', cust)) || E' (ok:1)\n';
  out := out || 'U7 rename works again ' || pg_temp.x(cust, format('update public.profiles set full_name = ''Maria Santos'' where id = %L', cust)) || E' (ok:1)\n';

  -- Delete.
  out := out || 'D1 wrong confirm email ' || pg_temp.x(adm, format('select public.delete_shopper(%L, ''nope@test.lovioo'')', cust2)) || E' (ERR Type the account)\n';
  out := out || 'D2 delete self ' || pg_temp.x(adm, format('select public.delete_shopper(%L, ''sa-adm@test.lovioo'')', adm)) || E' (ERR own account)\n';
  out := out || 'D3 admin deletes staff ' || pg_temp.x(adm, format('select public.delete_shopper(%L, ''sa-ed@test.lovioo'')', ed)) || E' (ERR super admin)\n';
  out := out || 'D4 admin deletes shopper ' || pg_temp.x(adm, format('select public.delete_shopper(%L, ''sa-cust2@test.lovioo'')', cust2)) || E' (ok:1)\n';
  out := out || 'D5 account gone ' || (select count(*) from auth.users where id = cust2) || E' (0)\n';
  out := out || 'D6 profile gone ' || (select count(*) from public.profiles where id = cust2) || E' (0)\n';
  out := out || 'D7 delete logged ' || (select count(*) from public.account_actions where target_user = cust2 and action = 'delete') || E' (1)\n';
  out := out || 'D8 log keeps the email ' || coalesce((select target_email from public.account_actions where target_user = cust2 and action = 'delete'), 'none') || E' (sa-cust2@test.lovioo)\n';
  out := out || 'D9 deleted account again ' || pg_temp.x(adm, format('select public.delete_shopper(%L, ''sa-cust2@test.lovioo'')', cust2)) || E' (ERR no longer exists)\n';
  out := out || 'N1 anon deletes ' || pg_temp.x(null, format('select public.delete_shopper(%L, ''sa-cust@test.lovioo'')', cust)) || E' (ERR)\n';

  -- Audit log visibility.
  out := out || 'L1 admin reads log ' || pg_temp.c(adm, 'select 1 from public.account_actions') || E' (n>0)\n';
  out := out || 'L2 customer reads log ' || pg_temp.c(cust, 'select 1 from public.account_actions') || E' (n=0)\n';
  out := out || 'L3 customer writes log ' || pg_temp.x(cust, format('insert into public.account_actions (target_user, action) values (%L, ''delete'')', cust)) || E' (ERR)\n';
  raise exception 'SHOPPER ADMIN TEST RESULTS (rolled back):%', out;
end $t$;
