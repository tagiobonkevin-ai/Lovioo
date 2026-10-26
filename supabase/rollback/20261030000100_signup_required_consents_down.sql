-- Rollback for migrations/20261030000100_signup_required_consents.sql. Not applied automatically.
-- Restores the sign-up trigger from 20261029000100_profile_details.sql (missing opt-ins recorded as "no").

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
