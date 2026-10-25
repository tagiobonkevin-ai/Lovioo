-- Trigger functions run from their triggers; they don't need to be callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.record_offer_price() from public, anon, authenticated;
