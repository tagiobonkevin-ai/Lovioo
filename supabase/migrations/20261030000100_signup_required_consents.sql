-- Sign-up now asks only for the two required agreements (Terms, Privacy Policy). Marketing emails and analytics are
-- chosen later (Profile -> Privacy choices, analytics bar), so a sign-up that doesn't mention them records nothing for
-- them instead of a "no". Older sign-up forms that still send them keep working.
-- Non-destructive (CREATE OR REPLACE only). Rollback: supabase/rollback/20261030000100_signup_required_consents_down.sql

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
      new.id, true, true,
      case when c ? 'marketing' then c ->> 'marketing' = 'true' end,
      case when c ? 'analytics' then c ->> 'analytics' = 'true' end,
      c ->> 'version', 'signup'
    );
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
