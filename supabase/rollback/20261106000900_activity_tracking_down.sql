-- Rollback for 20261106000900_activity_tracking.sql. Removes ONLY what that migration added (and the activity in it).
drop function if exists public.purge_old_activity(integer);
drop function if exists public.admin_insights(integer);
drop table if exists public.ai_events;
drop table if exists public.search_events;
