-- Feature the two brands with live products, so they lead Brand Crush, the Brands page and the home page.
-- Featured means "brands we highlight"; it doesn't claim a partnership. Update only.
update public.brands set featured = true where id in ('dear-face', 'goodies-nutrition');
