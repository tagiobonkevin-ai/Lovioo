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
alter policy "admins legacy super admin" on public.admins rename to "admins manage admins";
alter policy "admins manage admins" on public.admins
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Catalog policies
drop trigger if exists products_guard_publish on public.products;
drop function if exists public.guard_product_publish();

alter policy "products read" on public.products using (published or (select public.is_admin()));
alter policy "products editor insert" on public.products rename to "products admin insert";
alter policy "products admin insert" on public.products with check ((select public.is_admin()));
alter policy "products editor update" on public.products rename to "products admin update";
alter policy "products admin update" on public.products using ((select public.is_admin())) with check ((select public.is_admin()));

alter policy "offers read" on public.offers
  using (exists (select 1 from public.products p where p.id = product_id and (p.published or (select public.is_admin()))));
alter policy "offers editor insert" on public.offers rename to "offers admin insert";
alter policy "offers admin insert" on public.offers with check ((select public.is_admin()));
alter policy "offers editor update" on public.offers rename to "offers admin update";
alter policy "offers admin update" on public.offers using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "offers editor delete" on public.offers rename to "offers admin delete";
alter policy "offers admin delete" on public.offers using ((select public.is_admin()));

alter policy "history read" on public.price_history
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
