-- Rollback for 20261106001000_brand_partners_portal.sql. Removes ONLY what that migration added.
-- Partner-made products and offers stay (they're ordinary catalogue rows); partner logins stay as ordinary accounts.
drop function if exists public.admin_link_partner(text, text);
drop function if exists public.admin_partner_members();
drop function if exists public.partner_stats(text, integer);
drop function if exists public.claim_referral(text);
drop function if exists public.record_referral(text, text);
drop table if exists public.referral_signups;
drop table if exists public.referral_visits;
delete from public.retailers r where r.id = 'official' and not exists (select 1 from public.offers o where o.retailer_id = 'official');
drop trigger if exists products_guard_partner on public.products;
drop function if exists public.guard_partner_fields();
drop policy if exists "change requests partner insert" on public.product_change_requests;
drop policy if exists "offers partner delete" on public.offers;
drop policy if exists "offers partner update" on public.offers;
drop policy if exists "offers partner insert" on public.offers;
drop policy if exists "offers partner read" on public.offers;
drop policy if exists "products partner update" on public.products;
drop policy if exists "products partner insert" on public.products;
drop policy if exists "products partner read" on public.products;
drop function if exists public.my_partner_brands();
drop function if exists public.is_brand_member(text);
drop table if exists public.brand_members;
alter table public.brands drop column if exists is_partner;
