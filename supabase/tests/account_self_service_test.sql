-- Account self-service tests (run AFTER migrations 20261101000100 and 20261104000200). Everything runs in ONE
-- transaction that ends with a deliberate error, so it is all rolled back. The error lists each check with
-- its expected result in brackets.
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
do $t$
declare
  cust uuid := gen_random_uuid(); other uuid := gen_random_uuid(); adm uuid := gen_random_uuid();
  out text := E'\n';
begin
  insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at) values
    (cust,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ss-cust@test.lovioo', now(), '{"full_name":"Maria Santos"}', now(), now()),
    (other, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ss-other@test.lovioo', now(), '{"full_name":"Juan Cruz"}', now(), now()),
    (adm,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ss-adm@test.lovioo', now(), '{}', now(), now());
  update public.profiles set role = 'admin' where id = adm;

  -- The alert choices: a shopper owns their own and nobody else's.
  out := out || 'N1 own alerts ' || pg_temp.x(cust, format('update public.profiles set notify_drops = true, notify_digest = true where id = %L', cust)) || E' (ok:1)\n';
  out := out || 'N2 saved ' || (select case when notify_drops and notify_digest and not notify_restock then 'yes' else 'no' end from public.profiles where id = cust) || E' (yes)\n';
  out := out || 'N3 someone else''s alerts ' || pg_temp.x(cust, format('update public.profiles set notify_drops = true where id = %L', other)) || E' (ok:0)\n';
  out := out || 'N4 anon alerts ' || pg_temp.x(null, format('update public.profiles set notify_drops = true where id = %L', cust)) || E' (ERR or ok:0)\n';
  out := out || 'N5 role still out of reach ' || pg_temp.x(cust, format('update public.profiles set role = ''admin'' where id = %L', cust)) || E' (ERR permission)\n';

  -- Closing your own account.
  out := out || 'D1 anon calls delete_my_account ' || pg_temp.x(null, 'select public.delete_my_account(''ss-cust@test.lovioo'')') || E' (ERR)\n';
  out := out || 'D2 wrong email ' || pg_temp.x(cust, 'select public.delete_my_account(''typo@test.lovioo'')') || E' (ERR Type your email)\n';
  out := out || 'D3 still there ' || (select count(*)::text from auth.users where id = cust) || E' (1)\n';
  out := out || 'D4 admin self-delete blocked ' || pg_temp.x(adm, 'select public.delete_my_account(''ss-adm@test.lovioo'')') || E' (ERR Staff accounts)\n';
  out := out || 'D5 right email, case-insensitive ' || pg_temp.x(cust, 'select public.delete_my_account(''  SS-Cust@test.lovioo  '')') || E' (ok:1)\n';
  out := out || 'D6 account gone ' || (select count(*)::text from auth.users where id = cust) || E' (0)\n';
  out := out || 'D7 profile gone with it ' || (select count(*)::text from public.profiles where id = cust) || E' (0)\n';
  out := out || 'D8 audit row written ' || (select count(*)::text from public.account_actions where target_user = cust and action = 'self_delete') || E' (1)\n';
  out := out || 'D9 other account untouched ' || (select count(*)::text from auth.users where id = other) || E' (1)\n';

  raise exception 'RESULTS%', out;
end $t$;
rollback;
