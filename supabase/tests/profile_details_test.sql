-- Profile details tests (run AFTER migration 20261029000100). Everything runs in ONE transaction that ends with a
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
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  out text := E'\n';
begin
  -- a: Google-style sign-up (name + picture); b: email sign-up
  insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at) values
    (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pd-a@test.lovioo', now(),
     '{"name":"Maria Santos","picture":"https://lh3.googleusercontent.com/a/photo"}', now(), now()),
    (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pd-b@test.lovioo', now(), '{}', now(), now());

  out := out || 'G1 google name + photo ' || (select format('%s|%s|%s', full_name, avatar_url, profile_completed_at is null) from public.profiles where id = a) || E' (Maria Santos|https://lh3.googleusercontent.com/a/photo|true)\n';
  out := out || 'P1 set own details ' || pg_temp.x(a, format('update public.profiles set birthdate = ''1995-06-15'', gender = ''female'', city = '' Quezon City '', province = ''Metro Manila'' where id = %L', a)) || E' (ok:1)\n';
  out := out || 'P2 completed + trimmed ' || (select format('%s|%s', profile_completed_at is not null, city) from public.profiles where id = a) || E' (true|Quezon City)\n';
  out := out || 'P3 under 18 ' || pg_temp.x(b, format('update public.profiles set birthdate = current_date - 365 * 10 where id = %L', b)) || E' (ERR 18 and over)\n';
  out := out || 'P4 future birthday ' || pg_temp.x(b, format('update public.profiles set birthdate = current_date + 1 where id = %L', b)) || E' (ERR real birthday)\n';
  out := out || 'P5 bad gender ' || pg_temp.x(b, format('update public.profiles set gender = ''robot'' where id = %L', b)) || E' (ERR check)\n';
  out := out || 'P6 not complete without birthday ' || pg_temp.x(b, format('update public.profiles set city = ''Cebu City'' where id = %L', b)) || ' ' || (select (profile_completed_at is null)::text from public.profiles where id = b) || E' (ok:1 true)\n';
  out := out || 'P7 remove birthday ' || pg_temp.x(a, format('update public.profiles set birthdate = null where id = %L', a)) || E' (ERR not removed)\n';
  out := out || 'S1 someone else''s profile ' || pg_temp.x(b, format('update public.profiles set city = ''x'' where id = %L', a)) || E' (ok:0)\n';
  out := out || 'S2 set completed directly ' || pg_temp.x(b, format('update public.profiles set profile_completed_at = now() where id = %L', b)) || E' (ERR permission)\n';
  out := out || 'S3 set avatar directly ' || pg_temp.x(b, format('update public.profiles set avatar_url = ''https://evil.example/x.png'' where id = %L', b)) || E' (ERR permission)\n';
  out := out || 'S4 anon update ' || pg_temp.x(null, format('update public.profiles set city = ''x'' where id = %L', a)) || E' (ok:0 or ERR)\n';
  out := out || 'C1 consent sheet still works ' || pg_temp.x(b, 'select public.set_my_consents(true, true, false, false, ''2026-10-25'', ''consent_sheet'')') || E' (ok:1)\n';
  raise exception 'RESULTS%', out;
end $t$;
rollback;
