-- Fix: in reject_product_change, the "note" parameter clashed with the product_change_requests.note column.
create or replace function public.reject_product_change(request_id bigint, note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
begin
  if not public.is_admin() then
    raise exception 'Only admins can review changes' using errcode = '42501';
  end if;
  update public.product_change_requests r
  set status = 'rejected', review_note = left(coalesce(note, ''), 1000), reviewed_by = auth.uid(), reviewed_at = now(),
      reviewed_by_email = (select u.email from auth.users u where u.id = auth.uid())
  where r.id = request_id and r.status = 'pending';
  if not found then
    raise exception 'This request is no longer pending' using errcode = 'P0002';
  end if;
end;
$$;
revoke execute on function public.reject_product_change(bigint, text) from public, anon;
grant execute on function public.reject_product_change(bigint, text) to authenticated;
