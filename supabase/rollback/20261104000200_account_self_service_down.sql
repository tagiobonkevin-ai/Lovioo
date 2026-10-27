-- Undo 20261104000200. Dropping the columns loses the alert choices shoppers saved, so this is only for a
-- rollback of the whole change, not routine cleanup.

drop function if exists public.delete_my_account(text);

revoke update (notify_drops, notify_restock, notify_digest) on public.profiles from authenticated;

alter table public.profiles
  drop column if exists notify_drops,
  drop column if exists notify_restock,
  drop column if exists notify_digest;
