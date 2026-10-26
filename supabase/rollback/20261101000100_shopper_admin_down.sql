-- Rollback for migrations/20261101000100_shopper_admin.sql. Not applied automatically.
-- Removes name approval and the admin delete/rename tools, and restores the profile guard from 20261029000100.

drop function if exists public.delete_shopper(uuid, text);
drop function if exists public.admin_set_shopper_name(uuid, text);
drop function if exists public.approve_shopper_name(uuid, boolean);
drop function if exists public.log_account_action(uuid, text, text);
drop table if exists public.account_actions;
alter table public.profiles drop column if exists name_approved_at, drop column if exists name_approved_by;

create or replace function public.guard_profile_details()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.full_name := btrim(coalesce(new.full_name, ''));
  new.city := nullif(btrim(new.city), '');
  new.province := nullif(btrim(new.province), '');
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
