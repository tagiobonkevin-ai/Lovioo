-- Rollback for migrations/20261029000100_profile_details.sql. Not applied automatically.
-- Removes the profile detail columns (birthdays, gender, city, province, photos are lost) and restores the
-- sign-up trigger from 20261028000100_consents.sql.

begin;

drop trigger if exists profiles_guard_details on public.profiles;
drop function if exists public.guard_profile_details();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  c jsonb := new.raw_user_meta_data -> 'consent';
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  if jsonb_typeof(c) = 'object' and c ->> 'terms' = 'true' and c ->> 'privacy' = 'true' then
    perform public.record_consents(
      new.id, true, true, coalesce(c ->> 'marketing' = 'true', false), coalesce(c ->> 'analytics' = 'true', false), c ->> 'version', 'signup'
    );
  end if;
  return new;
end;
$$;

revoke update (birthdate, gender, city, province) on public.profiles from authenticated;
alter table public.profiles
  drop column if exists birthdate,
  drop column if exists gender,
  drop column if exists city,
  drop column if exists province,
  drop column if exists avatar_url,
  drop column if exists profile_completed_at;

commit;
