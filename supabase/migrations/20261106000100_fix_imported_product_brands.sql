-- Two imported products carried the wrong brand: one had a scraped category trail as its brand,
-- the other was filed under Beauty of Joseon. Give each its real brand. Inserts and updates only.
insert into public.brands (id, name) values
  ('dear-face', 'Dear Face'),
  ('goodies-nutrition', 'Goodies Nutrition')
on conflict (id) do nothing;

update public.products set brand = 'Dear Face', brand_id = 'dear-face' where id = 'p_fe1feac24b';
update public.products set brand = 'Goodies Nutrition', brand_id = 'goodies-nutrition' where id = 'p_90a0f7173b';
