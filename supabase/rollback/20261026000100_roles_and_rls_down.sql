-- Rollback for migrations/20261026000100_roles_and_rls.sql. Not applied automatically.
-- Run in the Supabase SQL editor only if Phase 1 must be undone. Restores the pre-Phase-1
-- definitions from 20261025000100_init_schema.sql. Admin access goes back to the public.admins
-- allow-list, so make sure every admin's email is still listed there first.

begin;

-- Timestamps
drop trigger if exists feedback_created_at on public.feedback;
drop trigger if exists product_events_created_at on public.product_events;
drop function if exists public.force_created_at();

-- Team and role management
drop function if exists public.list_team();
drop function if exists public.set_user_role(uuid, public.app_role);
drop table if exists public.role_changes;

-- Legacy allow-list policy
drop policy if exists "admins legacy read" on public.admins;
create policy "admins manage admins" on public.admins
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Catalog policies
drop trigger if exists products_guard_publish on public.products;
drop function if exists public.guard_product_publish();

drop policy if exists "products read" on public.products;
drop policy if exists "products editor insert" on public.products;
drop policy if exists "products editor update" on public.products;
create policy "products read" on public.products for select to anon, authenticated
  using (published or (select public.is_admin()));
create policy "products admin insert" on public.products for insert to authenticated with check ((select public.is_admin()));
create policy "products admin update" on public.products for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "offers read" on public.offers;
drop policy if exists "offers editor insert" on public.offers;
drop policy if exists "offers editor update" on public.offers;
drop policy if exists "offers editor delete" on public.offers;
create policy "offers read" on public.offers for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_admin()))));
create policy "offers admin insert" on public.offers for insert to authenticated with check ((select public.is_admin()));
create policy "offers admin update" on public.offers for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "offers admin delete" on public.offers for delete to authenticated using ((select public.is_admin()));

drop policy if exists "history read" on public.price_history;
create policy "history read" on public.price_history for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_admin()))));

-- Original is_admin(): confirmed email on the allow-list.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.admins a on a.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;

drop function if exists public.is_super_admin();
drop function if exists public.is_editor();
drop function if exists public.current_app_role();

-- Profiles: back to whole-row updates (own row only, via RLS).
grant update on public.profiles to authenticated;
alter table public.profiles drop column if exists role;
drop type if exists public.app_role;

commit;
