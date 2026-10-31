-- Undo 20261105000100: remove the categories it added. A category that products have since been filed
-- under is kept, so no product is left pointing at a missing category.

delete from public.categories c
 where c.id in ('appliances', 'groceries', 'health', 'automotive', 'books')
   and not exists (select 1 from public.products p where p.category_id = c.id);
