-- Two things a shopper should be able to do for themselves: choose which alerts they want, and leave.
--
-- Until now the Notifications switches in Profile were only React state: they saved nowhere, reset on
-- reload, and nothing read them. And there was no way to delete an account from inside the app at all --
-- the Privacy Policy sent people to email, which is slow and easy to lose.

-- 1. Alert choices live on the profile, so they survive a reload and a new device.
alter table public.profiles
  add column if not exists notify_drops boolean not null default false,
  add column if not exists notify_restock boolean not null default false,
  add column if not exists notify_digest boolean not null default false;

comment on column public.profiles.notify_drops is 'Wants price-drop alerts. Stored now; nothing sends yet.';
comment on column public.profiles.notify_restock is 'Wants back-in-stock alerts. Stored now; nothing sends yet.';
comment on column public.profiles.notify_digest is 'Wants the weekly deals digest. Stored now; nothing sends yet.';

-- Shoppers change their own through the existing "update own" policy; these are the only new columns they
-- may write, so role and email stay out of reach as before.
grant update (notify_drops, notify_restock, notify_digest) on public.profiles to authenticated;

/**
 * Close your own account for good. The sign-in, profile, saves, alerts, swipes and consent rows all go with
 * it (foreign keys cascade from auth.users), so this cannot be undone.
 *
 * Typing your own email address is the confirmation, the same shape delete_shopper uses for admins. Staff
 * accounts are deliberately excluded: a super admin leaving this way could lock everyone out of the admin,
 * so that stays a deliberate act by another super admin.
 */
create or replace function public.delete_my_account(confirm_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  my_email text;
  my_role public.app_role;
begin
  if me is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  select u.email::text, p.role into my_email, my_role
    from auth.users u left join public.profiles p on p.id = u.id
   where u.id = me;
  if my_email is null then
    raise exception 'That account no longer exists' using errcode = '22023';
  end if;
  if lower(btrim(coalesce(confirm_email, ''))) <> lower(my_email) then
    raise exception 'Type your email address to confirm' using errcode = '22023';
  end if;
  if my_role in ('admin', 'super_admin') then
    raise exception 'Staff accounts are closed by a super admin, not from here' using errcode = '42501';
  end if;
  perform public.log_account_action(me, 'self_delete', my_email);
  delete from auth.users where id = me;
end;
$$;
revoke execute on function public.delete_my_account(text) from public, anon;
grant execute on function public.delete_my_account(text) to authenticated;
