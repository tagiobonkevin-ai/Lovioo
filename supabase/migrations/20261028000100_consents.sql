-- Sign-up consents: Terms (required), Privacy Policy acknowledgement (required), marketing emails (optional) and
-- analytics (optional). The current choice lives on the profile; every change is logged in consent_events.
-- Non-destructive (no drops). Rollback: supabase/rollback/20261028000100_consents_down.sql

alter table public.profiles
  add column terms_accepted_at timestamptz,
  add column terms_version text,
  add column privacy_ack_at timestamptz,
  add column marketing_opt_in boolean not null default false,
  add column analytics_opt_in boolean not null default false;
-- Deliberately NOT added to the client column grants (Phase 1): these change only through set_my_consents().

create table public.consent_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('terms', 'privacy', 'marketing', 'analytics')),
  granted boolean not null,
  version text not null default '' check (char_length(version) <= 40),
  source text not null check (source in ('signup', 'consent_sheet', 'settings')),
  created_at timestamptz not null default now()
);
create index consent_events_user_idx on public.consent_events (user_id, created_at);
alter table public.consent_events enable row level security;
create policy "consent events read own or admin" on public.consent_events for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
-- No insert/update/delete policies: rows are written only by record_consents().

-- Applies a set of choices to one user and logs them. NULL means "no change". Terms and privacy can be accepted,
-- not withdrawn (withdrawing them means closing the account). Internal: called by the two functions below.
create or replace function public.record_consents(
  target uuid, terms boolean, privacy boolean, marketing boolean, analytics boolean, version text, source text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.profiles;
  v text := left(coalesce(version, ''), 40);
  first_time boolean := source in ('signup', 'consent_sheet');
  newly boolean;
begin
  if terms is false or privacy is false then
    raise exception 'The Terms and Privacy Policy can''t be withdrawn here. Contact us to close your account.' using errcode = '22023';
  end if;
  select * into p from public.profiles where id = target for update;
  if not found then
    raise exception 'No profile for this account' using errcode = 'P0002';
  end if;
  newly := p.terms_accepted_at is null or p.terms_version is distinct from v;

  if terms and newly then
    update public.profiles set terms_accepted_at = now(), terms_version = v where id = target;
    insert into public.consent_events (user_id, kind, granted, version, source) values (target, 'terms', true, v, source);
  end if;
  if privacy and (p.privacy_ack_at is null or newly) then
    update public.profiles set privacy_ack_at = now() where id = target;
    insert into public.consent_events (user_id, kind, granted, version, source) values (target, 'privacy', true, v, source);
  end if;
  if marketing is not null and (first_time or marketing is distinct from p.marketing_opt_in) then
    update public.profiles set marketing_opt_in = marketing where id = target;
    insert into public.consent_events (user_id, kind, granted, version, source) values (target, 'marketing', marketing, v, source);
  end if;
  if analytics is not null and (first_time or analytics is distinct from p.analytics_opt_in) then
    update public.profiles set analytics_opt_in = analytics where id = target;
    insert into public.consent_events (user_id, kind, granted, version, source) values (target, 'analytics', analytics, v, source);
  end if;
end;
$$;
revoke execute on function public.record_consents(uuid, boolean, boolean, boolean, boolean, text, text) from public, anon, authenticated;

-- The signed-in user's own choices (consent sheet and profile settings).
create or replace function public.set_my_consents(
  terms boolean default null, privacy boolean default null, marketing boolean default null, analytics boolean default null,
  version text default '', source text default 'settings'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  if source not in ('consent_sheet', 'settings') then
    raise exception 'Unknown consent source' using errcode = '22023';
  end if;
  perform public.record_consents(auth.uid(), terms, privacy, marketing, analytics, version, source);
end;
$$;
revoke execute on function public.set_my_consents(boolean, boolean, boolean, boolean, text, text) from public, anon;
grant execute on function public.set_my_consents(boolean, boolean, boolean, boolean, text, text) to authenticated;

-- Email sign-up sends its checkboxes as user metadata: {"consent": {"terms": true, "privacy": true, ...}}.
-- Only a complete acceptance is recorded; otherwise the app asks again after sign-in.
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
revoke execute on function public.handle_new_user() from public, anon, authenticated;
