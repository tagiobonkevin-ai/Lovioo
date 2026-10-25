-- Rollback for migrations/20261028000100_consents.sql. Not applied automatically.
-- Removes the consent log and columns and restores the original sign-up trigger. Consent records are lost.

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop function if exists public.set_my_consents(boolean, boolean, boolean, boolean, text, text);
drop function if exists public.record_consents(uuid, boolean, boolean, boolean, boolean, text, text);
drop table if exists public.consent_events;
alter table public.profiles
  drop column if exists terms_accepted_at,
  drop column if exists terms_version,
  drop column if exists privacy_ack_at,
  drop column if exists marketing_opt_in,
  drop column if exists analytics_opt_in;

commit;
