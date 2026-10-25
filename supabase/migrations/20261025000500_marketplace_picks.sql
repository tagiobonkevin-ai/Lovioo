-- "See prices" picks: popular Shopee/Lazada product types without a tracked price.
-- Shoppers see "See prices" and click through (via the store's affiliate link) to compare live listings.
-- Inserted unpublished: publish once the app version that understands price_tracked is deployed.

alter table public.products add column price_tracked boolean not null default true;
comment on column public.products.price_tracked is 'false = no tracked price; offers carry price 0 and the app shows "See prices".';

-- Untracked offers (price 0) shouldn't pollute price history.
create or replace function public.record_offer_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.price > 0 then
    insert into public.price_history (product_id, retailer_id, day, price)
    values (new.product_id, new.retailer_id, current_date, new.price)
    on conflict (product_id, retailer_id, day) do update set price = excluded.price;
  end if;
  return new;
end;
$$;
revoke execute on function public.record_offer_price() from public, anon, authenticated;

insert into public.categories (id, name, emoji, tint, sort)
values ('family', 'Family & Pets', '🐾', '#E6F4FF', 6)
on conflict (id) do nothing;

insert into public.products (id, slug, name, brand, category_id, subcategory, emoji, image, tags, vibes, rating, review_count, description, highlights, is_new, trending, published, price_tracked, sort)
select v.id, v.slug, v.name, 'Top sellers', v.category_id, v.subcategory, v.emoji, '', v.tags, v.vibes, 0, 0, v.description,
  array['Popular on Shopee and Lazada Philippines', 'Compare sellers, ratings and reviews before you buy', 'Prices change often — check the store for today''s deal'],
  true, v.trending, false, false, 100 + v.n
from (values
  (1,  'm01', 'rechargeable-mini-fan', 'Rechargeable Mini Fan', 'electronics', 'Gadgets', '🌀', array['fan','portable','summer','budget'], array['street','cozy'], 'Pocket-size USB rechargeable fan with multiple speeds — a hot-weather must for commutes, school and the office.', true),
  (2,  'm02', 'wireless-bluetooth-earbuds', 'Wireless Bluetooth Earbuds', 'electronics', 'Earbuds', '🎧', array['earbuds','wireless','bluetooth'], array['street','sporty'], 'True wireless earbuds with a charging case. Compare battery life, noise cancelling and reviews across sellers.', true),
  (3,  'm03', '10000mah-power-bank', '10,000mAh Power Bank', 'electronics', 'Power banks', '🔋', array['power bank','charging','travel'], array['street','workfromhome'], 'Slim 10,000mAh power bank for a full phone recharge or two. Look for fast-charge (PD/QC) support.', true),
  (4,  'm04', 'fast-charging-usb-c-cable', 'Fast-Charging USB-C Cable', 'electronics', 'Cables', '🔌', array['cable','usb-c','charging','budget'], array['workfromhome'], 'Braided USB-C fast-charging cable. Check the wattage and length that suit your phone and charger.', false),
  (5,  'm05', 'phone-holder-and-stand', 'Phone Holder & Stand', 'electronics', 'Phone accessories', '📱', array['phone stand','desk','budget'], array['workfromhome','cozy'], 'Adjustable desk stand for video calls, recipes and binge-watching. Foldable models travel well.', false),
  (6,  'm06', 'magnetic-phone-mount', 'Magnetic Phone Mount', 'electronics', 'Phone accessories', '🧲', array['phone mount','magnetic','car'], array['street'], 'Magnetic mount for car vents, dashboards or desks — snap your phone on and go.', false),
  (7,  'm07', 'bluetooth-portable-speaker', 'Bluetooth Portable Speaker', 'electronics', 'Speakers', '🔊', array['speaker','bluetooth','party'], array['cozy','street'], 'Compact Bluetooth speaker for beach trips and barkadas. Compare battery life and water resistance.', true),
  (8,  'm08', 'wireless-keyboard-and-mouse', 'Wireless Keyboard & Mouse Set', 'electronics', 'Computer accessories', '⌨️', array['keyboard','mouse','wireless'], array['workfromhome','gamer'], 'Plug-and-play wireless keyboard and mouse combo for a tidier WFH or study setup.', false),
  (9,  'm09', 'smartwatch', 'Smartwatch', 'electronics', 'Smartwatch', '⌚', array['smartwatch','fitness','notifications'], array['sporty','street'], 'Fitness tracking, notifications and sleep insights on your wrist. Budget and premium options abound.', true),
  (10, 'm10', 'usb-rechargeable-desk-lamp', 'USB Rechargeable Desk Lamp', 'electronics', 'Lighting', '💡', array['lamp','desk','study','rechargeable'], array['workfromhome','cozy'], 'Cordless LED desk lamp with adjustable brightness — handy for study nights and brownouts.', false),
  (11, 'm11', 'lip-tint', 'Lip Tint', 'beauty', 'Makeup', '💋', array['makeup','lip tint','k-beauty','budget'], array['glowup'], 'Long-wearing lip and cheek tint in everyday shades — a creator favourite for natural looks.', true),
  (12, 'm12', 'facial-sunscreen', 'Facial Sunscreen', 'beauty', 'Skincare', '☀️', array['skincare','sunscreen','spf'], array['glowup','sporty'], 'Lightweight daily SPF for humid weather. Compare SPF/PA rating, finish and skin type.', true),
  (13, 'm13', 'facial-cleanser', 'Facial Cleanser', 'beauty', 'Skincare', '🫧', array['skincare','cleanser'], array['glowup'], 'Gentle daily face wash — gel, foam and oil options for every skin type.', false),
  (14, 'm14', 'moisturising-serum', 'Moisturising Serum', 'beauty', 'Skincare', '💧', array['skincare','serum','hydrating'], array['glowup','cozy'], 'Hydrating serum with ingredients like hyaluronic acid or niacinamide for a dewy glow.', false),
  (15, 'm15', 'pimple-patches', 'Pimple Patches', 'beauty', 'Skincare', '🩹', array['skincare','acne','budget'], array['glowup'], 'Hydrocolloid patches that flatten breakouts overnight — cheap, cute and effective.', true),
  (16, 'm16', 'makeup-brush-set', 'Makeup Brush Set', 'beauty', 'Makeup', '🖌️', array['makeup','brushes','gift idea'], array['glowup'], 'Soft synthetic brush set for face and eyes, often with a travel pouch.', false),
  (17, 'm17', 'hair-claw-clips', 'Hair Claw Clips', 'beauty', 'Hair', '🦋', array['hair','accessories','budget'], array['glowup','street'], 'Matte and pastel claw clips for effortless updos — buy a set, mix and match.', true),
  (18, 'm18', 'hair-straightener', 'Hair Straightener', 'beauty', 'Hair', '💇', array['hair','styling','tools'], array['glowup'], 'Ceramic flat iron for sleek or wavy styles. Check temperature settings and plate size.', false),
  (19, 'm19', 'electric-facial-cleansing-brush', 'Electric Facial Cleansing Brush', 'beauty', 'Skincare tools', '✨', array['skincare','device','cleansing'], array['glowup'], 'Silicone sonic cleansing brush for a deeper clean — waterproof and rechargeable.', false),
  (20, 'm20', 'makeup-organiser', 'Makeup Organiser', 'beauty', 'Storage', '🗂️', array['organizer','makeup','vanity'], array['glowup','cozy'], 'Rotating or drawer-style organiser that keeps your vanity tidy and Instagram-ready.', false),
  (21, 'm21', 'dishwashing-liquid-kit', 'Dishwashing Liquid Kit', 'home', 'Cleaning', '🧽', array['cleaning','kitchen','budget'], array['cozy'], 'Value refill packs and dispensers for everyday dishwashing.', false),
  (22, 'm22', 'kitchen-sink-drain-strainer', 'Kitchen Sink Drain Strainer', 'home', 'Kitchen', '🚰', array['kitchen','sink','budget'], array['cozy'], 'Mesh strainer that catches food scraps and prevents clogs — a tiny buy with big payoff.', false),
  (23, 'm23', 'collapsible-storage-basket', 'Collapsible Storage Basket', 'home', 'Storage', '🧺', array['storage','organizer','laundry'], array['cozy'], 'Foldable baskets for laundry, toys and clutter — flat-packs when not in use.', false),
  (24, 'm24', 'drawer-organisers', 'Drawer Organisers', 'home', 'Storage', '📦', array['organizer','drawer','storage'], array['cozy','workfromhome'], 'Stackable dividers for drawers, desks and closets. Measure your drawers before buying.', false),
  (25, 'm25', 'electric-mini-chopper', 'Electric Mini Chopper', 'home', 'Kitchen appliances', '🧄', array['kitchen','appliance','rechargeable'], array['cozy'], 'Rechargeable garlic and onion chopper — prep sofrito in seconds.', true),
  (26, 'm26', 'oil-spray-bottle', 'Oil Spray Bottle', 'home', 'Kitchen', '🫒', array['kitchen','air fryer','cooking'], array['cozy','sporty'], 'Fine-mist oil sprayer for air fryers and salads — use less oil per meal.', false),
  (27, 'm27', 'airtight-food-containers', 'Airtight Food Containers', 'home', 'Kitchen', '🥡', array['kitchen','storage','meal prep'], array['cozy'], 'Stackable airtight containers for pantry staples and meal prep.', false),
  (28, 'm28', 'reusable-lint-remover', 'Reusable Lint Remover', 'home', 'Laundry', '🧶', array['laundry','clothes','pet hair'], array['cozy'], 'Washable lint and pet-hair roller — no refills needed.', false),
  (29, 'm29', 'microfibre-cleaning-cloths', 'Microfibre Cleaning Cloths', 'home', 'Cleaning', '🧼', array['cleaning','microfiber','budget'], array['cozy'], 'Absorbent, lint-free cloths for kitchens, screens and cars — buy in bulk packs.', false),
  (30, 'm30', 'motion-sensor-trash-bin', 'Motion-Sensor Trash Bin', 'home', 'Kitchen', '🗑️', array['smart home','kitchen','touchless'], array['cozy','workfromhome'], 'Touchless bin that opens with a wave — more hygienic kitchens and bathrooms.', false),
  (31, 'm31', 'womens-casual-dress', 'Women''s Casual Dress', 'fashion', 'Clothing', '👗', array['dress','casual','summer'], array['glowup','street'], 'Breezy everyday dresses for the heat — check size charts and fabric before you check out.', true),
  (32, 'm32', 'womens-wallet', 'Women''s Wallet', 'fashion', 'Accessories', '👛', array['wallet','accessories','gift idea'], array['glowup'], 'Compact and long wallets with card slots and coin pockets.', false),
  (33, 'm33', 'crossbody-sling-bag', 'Crossbody Sling Bag', 'fashion', 'Bags', '👜', array['bag','sling','everyday'], array['street'], 'Hands-free sling bag for commutes and travel — water-resistant options available.', true),
  (34, 'm34', 'everyday-sandals', 'Everyday Sandals', 'fashion', 'Footwear', '🩴', array['sandals','summer','comfort'], array['street','cozy'], 'Comfy slides and sandals for daily wear — look for cushioned, non-slip soles.', false),
  (35, 'm35', 'basic-cotton-t-shirts', 'Basic Cotton T-Shirts', 'fashion', 'Clothing', '👕', array['basics','tshirt','cotton'], array['street','cozy'], 'Wardrobe-staple cotton tees in multipacks — compare fabric weight and fit.', false),
  (36, 'm36', 'seamless-underwear', 'Seamless Underwear', 'fashion', 'Intimates', '🩲', array['basics','comfort'], array['cozy'], 'No-show seamless underwear in value packs.', false),
  (37, 'm37', 'automatic-folding-umbrella', 'Automatic Folding Umbrella', 'fashion', 'Accessories', '☂️', array['umbrella','rainy season','travel'], array['street'], 'One-touch open/close umbrella, compact enough for any bag — rainy-season essential.', true),
  (38, 'm38', 'stainless-steel-water-bottle', 'Stainless Steel Water Bottle', 'sports', 'Hydration', '🥤', array['bottle','insulated','outdoors'], array['sporty','street'], 'Insulated bottle that keeps drinks cold all day — sizes from 500ml to 1.2L.', false),
  (39, 'm39', 'travel-organiser-bags', 'Travel Organiser Bags', 'fashion', 'Travel', '🧳', array['travel','packing','organizer'], array['street'], 'Packing cubes and pouches that keep luggage neat for trips.', false),
  (40, 'm40', 'anti-slip-car-phone-holder', 'Anti-Slip Car Phone Holder', 'electronics', 'Car accessories', '🚗', array['car','phone holder'], array['street'], 'Dashboard or vent phone holder with a grippy, anti-slip base for navigation.', false),
  (41, 'm41', 'baby-wipes', 'Baby Wipes', 'family', 'Baby', '🧻', array['baby','wipes','essentials'], array['cozy'], 'Gentle, fragrance-free wipes in bulk packs — stock up when there''s a sale.', true),
  (42, 'm42', 'baby-diaper-pants', 'Baby Diaper Pants', 'family', 'Baby', '👶', array['baby','diapers','essentials'], array['cozy'], 'Pull-up diaper pants for active babies. Compare price per piece across sizes and brands.', true),
  (43, 'm43', 'weekly-pill-organiser', 'Weekly Pill Organiser', 'family', 'Health', '💊', array['health','organizer','budget'], array['cozy'], 'AM/PM weekly pill box — a thoughtful buy for lolo and lola.', false),
  (44, 'm44', 'pet-grooming-brush', 'Pet Grooming Brush', 'family', 'Pets', '🐕', array['pets','grooming','dog','cat'], array['cozy'], 'Self-cleaning slicker brush that lifts loose fur from cats and dogs.', true),
  (45, 'm45', 'interactive-cat-toy', 'Interactive Cat Toy', 'family', 'Pets', '🐈', array['pets','cat','toy'], array['cozy','gamer'], 'Feather wands, laser and motion toys to keep indoor cats busy.', false),
  (46, 'm46', 'pet-hair-remover', 'Pet Hair Remover', 'family', 'Pets', '🐾', array['pets','cleaning','pet hair'], array['cozy'], 'Reusable roller that lifts pet hair from sofas, beds and clothes.', false),
  (47, 'm47', 'car-interior-cleaning-gel', 'Car Interior Cleaning Gel', 'home', 'Car care', '🚙', array['car','cleaning','budget'], array['street'], 'Dust-grabbing gel for vents, consoles and keyboards — reusable until it darkens.', false),
  (48, 'm48', 'solar-string-lights', 'Solar String Lights', 'home', 'Lighting', '✨', array['lights','solar','decor','christmas'], array['cozy'], 'Solar-powered fairy lights for gardens and balconies — perfect for the holiday season.', true),
  (49, 'm49', 'rechargeable-emergency-light', 'Rechargeable Emergency Light', 'home', 'Lighting', '🔦', array['emergency','brownout','rechargeable'], array['cozy'], 'Auto-on LED light for brownouts and typhoon season — keep one in every room.', true),
  (50, 'm50', 'pickleball-paddle-set', 'Pickleball Paddle Set', 'sports', 'Racket sports', '🏓', array['pickleball','paddle','sports'], array['sporty'], 'Starter set with paddles and balls for the sport everyone is picking up.', true),
  (51, 'm51', 'aluminium-foil-sealant-tape', 'Aluminium Foil Sealant Tape', 'home', 'Repairs', '🩶', array['tape','waterproof','kitchen','repair'], array['cozy'], 'Waterproof foil tape that seals gaps around sinks, stoves and pipes — a quick fix against leaks and mould.', false),
  (52, 'm52', 'kitchen-sink-organiser', 'Kitchen Sink Organiser', 'home', 'Kitchen', '🧴', array['kitchen','sink','organizer'], array['cozy'], 'Caddy for sponges, soap and brushes that keeps the sink dry and tidy. Check the drain tray before you buy.', true),
  (53, 'm53', 'stackable-storage-boxes', 'Stackable Storage Boxes', 'home', 'Storage', '🗃️', array['storage','organizer','closet'], array['cozy','workfromhome'], 'Clear or fabric boxes with lids for closets, under-bed space and shelves. Measure your space first.', false),
  (54, 'm54', 'blackout-curtains', 'Blackout Curtains', 'home', 'Decor', '🪟', array['curtains','bedroom','sleep','heat'], array['cozy'], 'Thick curtains that block light and afternoon heat — better sleep and a cooler room. Check the width and length.', true),
  (55, 'm55', 'solar-garden-lights', 'Solar Garden Lights', 'home', 'Lighting', '🌻', array['solar','garden','outdoor','lights'], array['cozy'], 'Wire-free solar stake lights that switch on at dusk for paths, gardens and gates.', false),
  (56, 'm56', 'body-lotion', 'Body Lotion', 'beauty', 'Body care', '🧴', array['body care','lotion','whitening','spf'], array['glowup'], 'Everyday moisturising lotion — compare SPF, scent and size; big pump bottles are usually the best value.', true),
  (57, 'm57', 'oil-based-inspired-perfume', 'Oil-Based Inspired Perfume', 'beauty', 'Fragrance', '🌸', array['perfume','fragrance','gift idea','budget'], array['glowup','street'], 'Long-lasting oil-based scents inspired by designer fragrances. Read reviews on staying power before you pick.', true),
  (58, 'm58', 'mens-graphic-t-shirt', 'Men''s Graphic T-Shirt', 'fashion', 'Clothing', '👕', array['tshirt','graphic tee','men'], array['street'], 'Oversized and regular-fit graphic tees in cotton blends. Check the size chart — Asian sizes run small.', true),
  (59, 'm59', 'dri-fit-sports-shorts', 'Dri-Fit Sports Shorts', 'fashion', 'Activewear', '🩳', array['shorts','activewear','dri-fit','men'], array['sporty'], 'Quick-dry shorts for the gym, running and court — look for zip pockets and a built-in liner.', false),
  (60, 'm60', 'womens-maxi-dress', 'Women''s Maxi Dress', 'fashion', 'Clothing', '👗', array['dress','maxi','summer','vacation'], array['glowup'], 'Flowy full-length dresses for beach trips, brunches and weddings. Compare fabric and lining.', false),
  (61, 'm61', 'wide-leg-trousers', 'Wide-Leg Trousers', 'fashion', 'Clothing', '👖', array['trousers','office','women'], array['glowup','workfromhome'], 'High-waisted wide-leg pants that work for the office and weekends. Check inseam length for your height.', false),
  (62, 'm62', 'cargo-jogger-pants', 'Cargo Jogger Pants', 'fashion', 'Clothing', '🧥', array['cargo','joggers','streetwear'], array['street'], 'Relaxed cargo joggers with utility pockets and elastic cuffs — a streetwear staple.', true),
  (63, 'm63', 'casual-sneakers', 'Casual Sneakers', 'fashion', 'Footwear', '👟', array['sneakers','shoes','everyday'], array['street','sporty'], 'Everyday low-top sneakers that go with everything. Compare sole comfort and sizing reviews.', true),
  (64, 'm64', 'smart-wifi-plug', 'Smart Wi-Fi Plug', 'electronics', 'Smart home', '🔌', array['smart home','wifi','timer'], array['workfromhome','cozy'], 'Control fans, lamps and appliances from your phone, with schedules and energy monitoring. Check 2.4GHz Wi-Fi support.', false),
  (65, 'm65', 't700-carbon-pickleball-paddle', 'T700 Carbon Pickleball Paddle', 'sports', 'Racket sports', '🏓', array['pickleball','paddle','carbon fiber'], array['sporty'], 'Raw T700 carbon-fibre face for extra spin and control — the upgrade once you outgrow a starter paddle.', true),
  (66, 'm66', 'outdoor-pickleball-balls', 'Outdoor Pickleball Balls', 'sports', 'Racket sports', '🟡', array['pickleball','balls','outdoor'], array['sporty'], 'Durable 40-hole outdoor balls in multipacks. Look for consistent bounce and seamless construction.', false),
  (67, 'm67', 'pickleball-jersey', 'Pickleball Jersey', 'sports', 'Activewear', '🎽', array['pickleball','jersey','dri-fit'], array['sporty'], 'Breathable quick-dry jersey for matches in the heat — team-print and plain options.', false),
  (68, 'm68', 'pickleball-shorts', 'Pickleball Shorts', 'sports', 'Activewear', '🩳', array['pickleball','shorts','activewear'], array['sporty'], 'Light court shorts with ball pockets so you can serve without stopping.', false),
  (69, 'm69', 'womens-pickleball-skort', 'Women''s Pickleball Skort', 'sports', 'Activewear', '🎾', array['pickleball','skort','women','activewear'], array['sporty','glowup'], 'Skirt with built-in shorts and ball pockets — cute on court, comfy in the heat.', true),
  (70, 'm70', 'pickleball-paddle-bag', 'Pickleball Paddle Bag', 'sports', 'Bags', '🎒', array['pickleball','bag','backpack'], array['sporty'], 'Sling or backpack with paddle sleeves, a ball pocket and room for a water bottle.', false),
  (71, 'm71', 'paddle-grip-tape', 'Paddle Grip Tape', 'sports', 'Racket sports', '🌀', array['pickleball','grip','overgrip','budget'], array['sporty'], 'Tacky, sweat-absorbing overgrip that refreshes your paddle handle — cheap and quick to replace.', false),
  (72, 'm72', 'portable-pickleball-net', 'Portable Pickleball Net', 'sports', 'Racket sports', '🥅', array['pickleball','net','portable'], array['sporty'], 'Regulation-size net with a steel frame and carry bag — set up a court on any flat surface.', false),
  (73, 'm73', 'pickleball-court-shoes', 'Pickleball Court Shoes', 'sports', 'Footwear', '👟', array['pickleball','shoes','court'], array['sporty'], 'Court shoes with lateral support and grippy soles for quick side-to-side moves. Running shoes aren''t built for this.', false)
) as v (n, id, slug, name, category_id, subcategory, emoji, tags, vibes, description, trending)
on conflict (id) do nothing;

-- Shopee and Lazada offers without a tracked price: the app sends shoppers through each store's affiliate link.
insert into public.offers (product_id, retailer_id, price, original_price, shipping, in_stock, url)
select p.id, r.id, 0, 0, 0, true, ''
from public.products p
cross join (values ('shopee'), ('lazada')) as r (id)
where p.id ~ '^m[0-9]{2}$'
on conflict (product_id, retailer_id) do nothing;
