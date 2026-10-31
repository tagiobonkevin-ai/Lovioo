-- Rollback for migrations/20261106000700_collections.sql. Not run automatically. Drops ONLY the two collections
-- tables and their function (their curated content is lost); products and everything else are untouched.
drop function if exists public.public_collections();
drop table if exists public.collection_items;
drop table if exists public.collections;
