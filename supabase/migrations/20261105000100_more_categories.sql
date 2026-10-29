-- More shopping categories: appliances, groceries, health, motors and books.
--
-- Only adds rows. Existing categories (including any an admin renamed or re-sorted in Admin -> Categories)
-- are left exactly as they are, and no product changes category. Products can be moved into the new
-- categories from the admin product form.

insert into public.categories (id, name, emoji, tint, sort) values
  ('appliances', 'Home Appliances', '🔌', '#EAEEF5', 7),
  ('groceries', 'Groceries', '🛒', '#FFF6D6', 8),
  ('health', 'Health & Wellness', '💊', '#E2F6F3', 9),
  ('automotive', 'Motors & Automotive', '🏍️', '#E6ECEF', 10),
  ('books', 'Books & Stationery', '📚', '#F3F7DD', 11)
on conflict (id) do nothing;
