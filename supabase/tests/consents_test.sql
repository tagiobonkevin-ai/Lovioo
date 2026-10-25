-- Consent tests (run AFTER migration 20261028000100). Everything runs in ONE transaction that ends with a deliberate
-- error, so it is all rolled back. The error message lists each check with its expected result in brackets.
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
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); g uuid := gen_random_uuid();
  out text := E'\n';
begin
  -- a: email sign-up with all four boxes answered; b: sign-up without consent (e.g. Google); g: partial (required missing)
  insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at) values
    (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c-a@test.lovioo', now(),
     '{"full_name":"A","consent":{"terms":true,"privacy":true,"marketing":true,"analytics":false,"version":"2026-10-28"}}', now(), now()),
    (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c-b@test.lovioo', now(), '{"name":"B"}', now(), now()),
    (g, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c-g@test.lovioo', now(),
     '{"consent":{"terms":true,"privacy":false,"marketing":"yes"}}', now(), now());

  out := out || 'S1 signup stamped ' || (select format('%s/%s/%s/%s/%s', terms_accepted_at is not null, terms_version, privacy_ack_at is not null, marketing_opt_in, analytics_opt_in) from public.profiles where id = a) || E' (true/2026-10-28/true/true/false)\n';
  out := out || 'S2 signup logged ' || (select count(*) from public.consent_events where user_id = a and source = 'signup') || E' (4)\n';
  out := out || 'S3 no consent, nothing stamped ' || (select format('%s/%s', terms_accepted_at is null, (select count(*) from public.consent_events where user_id = b)) from public.profiles where id = b) || E' (true/0)\n';
  out := out || 'S4 partial consent ignored ' || (select format('%s/%s', terms_accepted_at is null, (select count(*) from public.consent_events where user_id = g)) from public.profiles where id = g) || E' (true/0)\n';

  out := out || 'U1 direct update of consent column ' || pg_temp.x(b, format('update public.profiles set terms_accepted_at = now() where id = %L', b)) || E' (ERR permission)\n';
  out := out || 'U2 direct update of marketing ' || pg_temp.x(a, format('update public.profiles set marketing_opt_in = false where id = %L', a)) || E' (ERR permission)\n';
  out := out || 'U3 own prefs still editable ' || pg_temp.x(b, format('update public.profiles set full_name = ''Bee'' where id = %L', b)) || E' (ok:1)\n';
  out := out || 'U4 direct insert into log ' || pg_temp.x(b, format('insert into public.consent_events (user_id, kind, granted, source) values (%L, ''terms'', true, ''settings'')', b)) || E' (ERR)\n';

  out := out || 'R1 consent sheet ' || pg_temp.x(b, 'select public.set_my_consents(true, true, false, true, ''2026-10-28'', ''consent_sheet'')') || E' (ok:1)\n';
  out := out || 'R2 sheet stamped ' || (select format('%s/%s/%s/%s', terms_accepted_at is not null, privacy_ack_at is not null, marketing_opt_in, analytics_opt_in) from public.profiles where id = b) || E' (true/true/false/true)\n';
  out := out || 'R3 sheet logged ' || (select count(*) from public.consent_events where user_id = b) || E' (4)\n';
  out := out || 'R4 settings toggle marketing ' || pg_temp.x(b, 'select public.set_my_consents(marketing => true, version => ''2026-10-28'')') || E' (ok:1)\n';
  out := out || 'R5 toggle logged once ' || (select format('%s/%s', (select marketing_opt_in from public.profiles where id = b), count(*)) from public.consent_events where user_id = b) || E' (true/5)\n';
  out := out || 'R6 same value no new log ' || pg_temp.x(b, 'select public.set_my_consents(marketing => true, version => ''2026-10-28'')') || ' ' || (select count(*) from public.consent_events where user_id = b) || E' (ok:1 5)\n';
  out := out || 'R7 withdraw terms ' || pg_temp.x(b, 'select public.set_my_consents(terms => false)') || E' (ERR withdrawn)\n';
  out := out || 'R8 fake signup source ' || pg_temp.x(b, 'select public.set_my_consents(true, true, true, true, ''x'', ''signup'')') || E' (ERR source)\n';
  out := out || 'R9 new terms version re-logged ' || pg_temp.x(b, 'select public.set_my_consents(true, true, null, null, ''2027-01-01'', ''consent_sheet'')') || E' (ok:1)\n';
  out := out || 'R9b version stored ' || (select terms_version from public.profiles where id = b) || E' (2027-01-01)\n';
  out := out || 'R10 internal fn not callable ' || pg_temp.x(b, format('select public.record_consents(%L, true, true, true, true, ''x'', ''settings'')', a)) || E' (ERR permission)\n';
  out := out || 'N1 anon set consents ' || pg_temp.x(null, 'select public.set_my_consents(marketing => true)') || E' (ERR)\n';
  out := out || 'L1 own log ' || pg_temp.c(b, 'select 1 from public.consent_events') || E' (n=7)\n';
  out := out || 'L2 others hidden ' || pg_temp.c(b, format('select 1 from public.consent_events where user_id = %L', a)) || E' (n=0)\n';
  raise exception 'RESULTS%', out;
end $t$;
rollback;
