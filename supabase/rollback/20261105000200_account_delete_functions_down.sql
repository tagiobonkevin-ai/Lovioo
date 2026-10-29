-- Rollback for migrations/20261105000200_account_delete_functions.sql. Not applied automatically.

drop function if exists public.delete_my_account(text);
drop function if exists public.delete_shopper(uuid, text);
