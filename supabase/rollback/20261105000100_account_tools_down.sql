-- Rollback for migrations/20261105000100_account_tools.sql. Not applied automatically.
-- Run 20261105000200_account_delete_functions_down.sql first if part 2 was applied, since it depends on this.
-- Dropping the notify_ columns loses the alert choices shoppers saved.

drop function if exists public.admin_set_shopper_name(uuid, text);
drop function if exists public.approve_shopper_name(uuid, boolean);
drop function if exists public.log_account_action(uuid, text, text);
drop table if exists public.account_actions;
revoke update (notify_drops, notify_restock, notify_digest) on public.profiles from authenticated;
alter table public.profiles
  drop column if exists name_approved_at,
  drop column if exists name_approved_by,
  drop column if exists notify_drops,
  drop column if exists notify_restock,
  drop column if exists notify_digest;

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
