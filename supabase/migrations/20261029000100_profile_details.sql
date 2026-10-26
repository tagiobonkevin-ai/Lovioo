-- Profile details asked after sign-up (Google or email): birthday (required, 18+), gender, city and province
-- (optional), and the Google profile photo. Name + birthday complete the profile.
-- Non-destructive (no drops). Rollback: supabase/rollback/20261029000100_profile_details_down.sql

alter table public.profiles
  add column birthdate date,
  add column gender text check (gender in ('female', 'male', 'nonbinary', 'prefer_not_to_say')),
  add column city text check (char_length(city) <= 80),
  add column province text check (char_length(province) <= 80),
  add column avatar_url text check (avatar_url is null or avatar_url ~* '^https://'),
  add column profile_completed_at timestamptz;
comment on column public.profiles.profile_completed_at is 'Set the first time the profile has a name and a birthdate; the app asks until then.';

-- Users edit their own details (RLS "update own" still applies). avatar_url and profile_completed_at stay server-set.
grant update (birthdate, gender, city, province) on public.profiles to authenticated;

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
create trigger profiles_guard_details before update on public.profiles
  for each row execute function public.guard_profile_details();

-- Sign-up: also keep the Google profile photo (https only). Consent handling is unchanged from 20261028000100.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  c jsonb := new.raw_user_meta_data -> 'consent';
  photo text := coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture');
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    case when photo ~* '^https://' and char_length(photo) <= 1000 then photo end
  );
  if jsonb_typeof(c) = 'object' and c ->> 'terms' = 'true' and c ->> 'privacy' = 'true' then
    perform public.record_consents(
      new.id, true, true, coalesce(c ->> 'marketing' = 'true', false), coalesce(c ->> 'analytics' = 'true', false), c ->> 'version', 'signup'
    );
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
