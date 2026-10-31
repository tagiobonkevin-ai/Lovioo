import type { Supabase } from "@/lib/supabase/client";
import { buildCatalog, type Catalog } from "./catalog";
import { mapCollection } from "./collections";

/**
 * Reads the catalog from Supabase. Products, offers (prices) and price stats are members-only (RLS), so they're asked
 * for only with `products: true` from a signed-in browser; the server reads the public parts only, which keeps
 * products and prices out of every page's HTML.
 */
export async function fetchCatalog(sb: Supabase, { products: withProducts }: { products: boolean }): Promise<Catalog> {
  const [categories, retailers, brands, products, stats, collections, items] = await Promise.all([
    sb.from("categories").select("*").order("sort"),
    sb.from("retailers").select("*").order("sort"),
    sb.from("brands").select("*").eq("published", true).order("sort").order("name"),
    withProducts ? sb.from("products").select("*, offers(*)").eq("published", true).order("sort").order("created_at") : null,
    withProducts ? sb.from("product_price_stats").select("*") : null,
    // Collections from Admin -> Collections: the rows are public, their product lists are for members.
    sb.from("collections").select("*").eq("published", true).order("sort").order("created_at"),
    withProducts ? sb.from("collection_items").select("*").order("sort") : null,
  ]);
  // The brands table arrives with migration 20261026000200; until it's applied, run without brand pages.
  const brandsMissing = brands.error && /brands|42P01|PGRST20/.test(`${brands.error.code} ${brands.error.message}`);
  const error = categories.error ?? retailers.error ?? products?.error ?? stats?.error ?? (brandsMissing ? null : brands.error);
  if (error) throw new Error(`Couldn't load the catalog from Supabase: ${error.message}`);

  // Collections are optional extras: if their tables aren't there yet, the site runs on its automatic sections.
  const ids = new Map<string, string[]>();
  for (const it of items?.data ?? []) ids.set(it.collection_id, [...(ids.get(it.collection_id) ?? []), it.product_id]);
  const cols = (collections.error ? [] : collections.data ?? []).map((c) => mapCollection(c, ids.get(c.id) ?? []));

  return { ...buildCatalog(categories.data!, retailers.data!, products?.data ?? [], stats?.data ?? [], brands.data ?? []), collections: cols };
}
