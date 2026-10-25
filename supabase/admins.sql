-- Who can open /admin. Run in the Supabase SQL editor; emails must be lowercase.
-- The account also needs a confirmed email address.
insert into public.admins (email) values ('kevin@cleons.net') on conflict do nothing;
