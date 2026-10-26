-- Admins approve a shopper's name (after which only an admin can change it) and can delete an account outright.
-- Approval doesn't gate anything: people use Lovioo from the moment they sign up.
-- Non-destructive (no drops). Rollback: supabase/rollback/20261101000100_shopper_admin_down.sql

alter table public.profiles
  add column name_approved_at timestamptz,
  add column name_approved_by uuid references auth.users (id) on delete set null;
comment on column public.profiles.name_approved_at is 'Set when an admin approves the name; from then on only an admin can change it.';

-- Append-only record of what admins did to shopper accounts. target_user has no FK, so a delete keeps its own record.
create table if not exists public.account_actions (
  id bigint generated always as identity primary key,
  actor uuid references auth.users (id) on delete set null,
  actor_email text not null default '',
  target_user uuid not null,
  target_email text not null default '',
  action text not null check (action in ('approve_name', 'unapprove_name', 'rename', 'delete')),
  detail text not null default '',
  created_at timestamptz not null default now()
);
alter table public.account_actions enable row level security;
create policy "account actions admin read" on public.account_actions for select to authenticated using ((select public.is_admin()));
grant select on public.account_actions to authenticated;

-- An approved name is fixed for the shopper. Admins change it through admin_set_shopper_name().
create or replace function public.guard_profile_details()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.full_name := btrim(coalesce(new.full_name, ''));
  new.city := nullif(btrim(new.city), '');
  new.province := nullif(btrim(new.province), '');
  if old.name_approved_at is not null and new.full_name is distinct from old.full_name and not public.is_admin() then
    raise exception 'Your name has been approved by the Lovioo team and can no longer be changed. Contact support if it is wrong.' using errcode = '42501';
  end if;
  -- Approval itself is admin-only: set_my_consents-style client updates can't grant it (no column grant either).
  if (new.name_approved_at is distinct from old.name_approved_at or new.name_approved_by is distinct from old.name_approved_by) and not public.is_admin() then
    new.name_approved_at := old.name_approved_at;
    new.name_approved_by := old.name_approved_by;
  end if;
  if old.birthdate is not null and new.birthdate is null then
    raise exception 'Your birthday can be changed but not removed' using errcode = '22023';
  end if;
  if new.birthdate is distinct from old.birthdate and new.birthdate is not null then
    if new.birthdate < date '1900-01-01' or new.birthdate > current_date then
      raise exception 'Please enter a real birthday' using errcode = '22023';
    end if;
    if new.birthdate > (current_date - interval '18 years')::date then
      raise exception 'Lovioo accounts are for people 18 and over' using errcode = '22023';
    end if;
  end if;
  if old.profile_completed_at is null and new.full_name <> '' and new.birthdate is not null then
    new.profile_completed_at := now();
  elsif tg_op = 'UPDATE' then
    new.profile_completed_at := old.profile_completed_at;
  end if;
  return new;
end;
$$;
revoke execute on function public.guard_profile_details() from public, anon, authenticated;

/** Writes one audit row. Internal: the admin functions below call it. */
create or replace function public.log_account_action(target uuid, what text, why text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.account_actions (actor, actor_email, target_user, target_email, action, detail)
  values (
    auth.uid(),
    coalesce((select u.email from auth.users u where u.id = auth.uid()), ''),
    target,
    coalesce((select u.email from auth.users u where u.id = target), ''),
    what,
    coalesce(why, '')
  );
end;
$$;
revoke execute on function public.log_account_action(uuid, text, text) from public, anon, authenticated;

/** Approve (or withdraw approval of) a shopper's name. Admins and the super admin only. */
create or replace function public.approve_shopper_name(target uuid, approved boolean default true)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can approve names' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id = target) then
    raise exception 'That account no longer exists' using errcode = '22023';
  end if;
  update public.profiles
     set name_approved_at = case when approved then now() end,
         name_approved_by = case when approved then auth.uid() end
   where id = target;
  perform public.log_account_action(target, case when approved then 'approve_name' else 'unapprove_name' end, '');
end;
$$;
revoke execute on function public.approve_shopper_name(uuid, boolean) from public, anon;
grant execute on function public.approve_shopper_name(uuid, boolean) to authenticated;

/** Correct an approved shopper's name. Admins and the super admin only; the change is recorded. */
create or replace function public.admin_set_shopper_name(target uuid, new_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := btrim(coalesce(new_name, ''));
  was text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can change a shopper''s name' using errcode = '42501';
  end if;
  if clean = '' or char_length(clean) > 80 then
    raise exception 'Enter a name of 1 to 80 characters' using errcode = '22023';
  end if;
  select p.full_name into was from public.profiles p where p.id = target;
  if was is null then
    raise exception 'That account no longer exists' using errcode = '22023';
  end if;
  update public.profiles set full_name = clean where id = target;
  perform public.log_account_action(target, 'rename', was || ' → ' || clean);
end;
$$;
revoke execute on function public.admin_set_shopper_name(uuid, text) from public, anon;
grant execute on function public.admin_set_shopper_name(uuid, text) to authenticated;

/**
 * Delete a shopper account for good: the sign-in, profile, saves, alerts, swipes and consent rows all go
 * (foreign keys cascade from auth.users). Admins and the super admin only; staff accounts are protected.
 */
create or replace function public.delete_shopper(target uuid, confirm_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role public.app_role;
  target_email text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete accounts' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'You can''t delete your own account here' using errcode = '42501';
  end if;
  select u.email::text, p.role into target_email, target_role
    from auth.users u left join public.profiles p on p.id = u.id
   where u.id = target;
  if target_email is null then
    raise exception 'That account no longer exists' using errcode = '22023';
  end if;
  if lower(btrim(coalesce(confirm_email, ''))) <> lower(target_email) then
    raise exception 'Type the account''s email address to confirm the deletion' using errcode = '22023';
  end if;
  if target_role in ('admin', 'super_admin') and not public.is_super_admin() then
    raise exception 'Only the super admin can delete a staff account' using errcode = '42501';
  end if;
  if target_role = 'super_admin'
     and (select count(*) from public.profiles p where p.role = 'super_admin') <= 1 then
    raise exception 'Lovioo needs at least one super admin' using errcode = '42501';
  end if;
  perform public.log_account_action(target, 'delete', target_email);
  delete from auth.users where id = target;
end;
$$;
revoke execute on function public.delete_shopper(uuid, text) from public, anon;
grant execute on function public.delete_shopper(uuid, text) to authenticated;
