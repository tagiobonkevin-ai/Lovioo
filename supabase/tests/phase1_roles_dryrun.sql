-- Phase 1 dry run: applies migrations/20261026000100_roles_and_rls.sql and runs role tests in ONE transaction,
-- then raises an error on purpose so EVERYTHING is rolled back (including the 4 temporary test users).
-- Paste the whole file into Supabase > SQL Editor > Run. The error message 'PHASE1 TEST RESULTS (rolled back): ...'
-- lists each check with its expected result in brackets.

begin;
-- Phase 1: roles (customer, editor, admin, super_admin), role-aware RLS and audited role changes.
-- Non-destructive: the legacy public.admins table is kept (read-only). Rollback: supabase/rollback/20261026000100_roles_and_rls_down.sql

create type public.app_role as enum ('customer', 'editor', 'admin', 'super_admin');

alter table public.profiles add column role public.app_role not null default 'customer';
comment on column public.profiles.role is 'Access level. Changed only through public.set_user_role() by a super admin.';

-- Everyone on the legacy admin allow-list becomes a super admin.
update public.profiles p
set role = 'super_admin'
from auth.users u
join public.admins a on a.email = lower(u.email)
where u.id = p.id;

-- Users may edit their own preferences, but never their role or email.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, interests, budget, platforms, onboarded, streak, streak_day) on public.profiles to authenticated;

-- Role helpers. A role only counts once the account's email is confirmed.
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.uid() is null then null
    else coalesce(
      (select p.role
       from public.profiles p
       join auth.users u on u.id = p.id
       where p.id = auth.uid() and u.email_confirmed_at is not null),
      'customer'::public.app_role
    )
  end;
$$;

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('editor', 'admin', 'super_admin'), false);
$$;

-- Redefined: existing policies that call is_admin() now follow profiles.role.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'super_admin'), false);
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'super_admin', false);
$$;

revoke execute on function public.current_app_role() from public;
revoke execute on function public.is_editor() from public;
revoke execute on function public.is_super_admin() from public;
grant execute on function public.current_app_role() to anon, authenticated;
grant execute on function public.is_editor() to anon, authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;

-- Catalog: editors draft products and offers; only admins publish, unpublish or delete.
drop policy "products read" on public.products;
drop policy "products admin insert" on public.products;
drop policy "products admin update" on public.products;
create policy "products read" on public.products for select to anon, authenticated
  using (published or (select public.is_editor()));
create policy "products editor insert" on public.products for insert to authenticated
  with check ((select public.is_editor()));
create policy "products editor update" on public.products for update to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));
-- "products admin delete" stays as is.

create or replace function public.guard_product_publish()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- No end user (SQL editor, migrations): RLS already keeps anonymous API calls out.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.published := false;
  elsif new.published is distinct from old.published then
    raise exception 'Only admins can publish or unpublish products' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.guard_product_publish() from public, anon, authenticated;
create trigger products_guard_publish before insert or update on public.products
  for each row execute function public.guard_product_publish();

drop policy "offers read" on public.offers;
drop policy "offers admin insert" on public.offers;
drop policy "offers admin update" on public.offers;
drop policy "offers admin delete" on public.offers;
create policy "offers read" on public.offers for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_editor()))));
create policy "offers editor insert" on public.offers for insert to authenticated
  with check ((select public.is_editor()));
create policy "offers editor update" on public.offers for update to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));
create policy "offers editor delete" on public.offers for delete to authenticated
  using ((select public.is_editor()));

drop policy "history read" on public.price_history;
create policy "history read" on public.price_history for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_editor()))));
-- price_history writes stay admin-only; offer price changes are recorded by the record_offer_price trigger.

-- Legacy allow-list: readable by super admins, no longer writable from the app.
drop policy "admins manage admins" on public.admins;
create policy "admins legacy read" on public.admins for select to authenticated
  using ((select public.is_super_admin()));

-- Role changes: audit trail, written only by set_user_role().
create table public.role_changes (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  user_email text not null,
  old_role public.app_role,
  new_role public.app_role not null,
  changed_by uuid references auth.users (id) on delete set null,
  changed_by_email text,
  created_at timestamptz not null default now()
);
alter table public.role_changes enable row level security;
create policy "role changes admin read" on public.role_changes for select to authenticated
  using ((select public.is_admin()));

create or replace function public.set_user_role(target uuid, new_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old public.app_role;
  target_email text;
begin
  if not public.is_super_admin() then
    raise exception 'Only a super admin can change roles' using errcode = '42501';
  end if;

  select p.role, u.email into old, target_email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = target
  for update of p;
  if not found then
    raise exception 'No such user' using errcode = 'P0002';
  end if;
  if old = new_role then
    return;
  end if;

  if old = 'super_admin' then
    perform 1 from public.profiles where role = 'super_admin' for update;
    if (select count(*) from public.profiles where role = 'super_admin') <= 1 then
      raise exception 'Lovioo needs at least one super admin' using errcode = '42501';
    end if;
  end if;

  update public.profiles set role = new_role where id = target;
  insert into public.role_changes (user_id, user_email, old_role, new_role, changed_by, changed_by_email)
  values (target, target_email, old, new_role, auth.uid(), (select email from auth.users where id = auth.uid()));
end;
$$;
revoke execute on function public.set_user_role(uuid, public.app_role) from public, anon;
grant execute on function public.set_user_role(uuid, public.app_role) to authenticated;

-- Team list for admins, with the real sign-in email from auth.users.
create or replace function public.list_team()
returns table (id uuid, email text, full_name text, role public.app_role, email_confirmed boolean, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.full_name, p.role, u.email_confirmed_at is not null, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.role desc, p.created_at
    limit 1000;
end;
$$;
revoke execute on function public.list_team() from public, anon;
grant execute on function public.list_team() to authenticated;

-- Analytics and feedback timestamps come from the server, not the client.
create or replace function public.force_created_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := now();
  return new;
end;
$$;
revoke execute on function public.force_created_at() from public, anon, authenticated;
create trigger product_events_created_at before insert on public.product_events
  for each row execute function public.force_created_at();
create trigger feedback_created_at before insert on public.feedback
  for each row execute function public.force_created_at();
-- Phase 1 role tests. Runs as the postgres session; each check switches to anon/authenticated with JWT claims.
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
