-- Starter Brand Crush covers -> Lovioo's own lifestyle photos (public/images/home on lovioo.shop).
-- Data-only and non-destructive: only rows still on their original starter Unsplash cover change, so a cover an
-- admin has already picked in Admin -> Collections is left alone.
-- Rollback: supabase/rollback/20261106000800_collection_covers_lovioo_photos_down.sql
update public.collections c
   set cover_url = v.cover
  from (values
    ('gadget-crush', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=640&h=800&q=75', 'https://lovioo.shop/images/home/headphones.webp'),
    ('style-crush',  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=640&h=800&q=75', 'https://lovioo.shop/images/home/streetwear.webp'),
    ('beauty-crush', 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=640&h=800&q=75', 'https://lovioo.shop/images/home/skincare.webp'),
    ('home-crush',   'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=640&h=800&q=75', 'https://lovioo.shop/images/home/living-room.webp'),
    ('daily-crush',  'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=640&h=800&q=75', 'https://lovioo.shop/images/home/shopper-phone.webp'),
    ('budget-crush', 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=640&h=800&q=75', 'https://lovioo.shop/images/home/friends-shopping.webp')
  ) as v(id, seed, cover)
 where c.id = v.id and c.cover_url = v.seed;
