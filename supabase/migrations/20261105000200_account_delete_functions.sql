-- Shopper account tools, part 2: the two functions that delete a sign-in.
-- NOT YET APPLIED to the live database. Each contains "delete from auth.users", which makes Supabase ask for
-- approval, so they are run by hand in the SQL editor (a "destructive operation" warning is expected -- these
-- statements define functions; they delete nothing when run). Depends on 20261105000100 (log_account_action).
-- Rollback: supabase/rollback/20261105000200_account_delete_functions_down.sql

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
    raise exception 'You cannot delete your own account here' using errcode = '42501';
  end if;
  select u.email::text, p.role into target_email, target_role
    from auth.users u left join public.profiles p on p.id = u.id
   where u.id = target;
  if target_email is null then
    raise exception 'That account no longer exists' using errcode = '22023';
  end if;
  if lower(btrim(coalesce(confirm_email, ''))) <> lower(target_email) then
    raise exception 'Type the account email address to confirm the deletion' using errcode = '22023';
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
