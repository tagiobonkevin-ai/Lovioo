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
