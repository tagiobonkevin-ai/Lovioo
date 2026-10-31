-- Rollback for 20261106000300_feature_live_brands.sql. Not run automatically.
update public.brands set featured = false where id in ('dear-face', 'goodies-nutrition');
