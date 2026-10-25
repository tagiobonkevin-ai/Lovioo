-- Store-level affiliate link, used when an offer has no product-specific link yet.
alter table public.retailers add column affiliate_url text
  check (affiliate_url is null or affiliate_url ~* '^https://');

update public.retailers set affiliate_url = 'https://s.lazada.com.ph/s.ZRaNRP?t=p-iGwHbSr-s2LQrobW' where id = 'lazada';
update public.retailers set affiliate_url = 'https://s.shopee.ph/3B8QrmvWxe' where id = 'shopee';
