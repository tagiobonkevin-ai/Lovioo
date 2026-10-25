import "server-only";
import { cache } from "react";
import { createServerClient } from "@/lib/supabase/client";
import { applyCatalog, buildCatalog, demoCatalog, type Catalog } from "./catalog";

/**
 * Loads the published catalog from Supabase once per request (pages are revalidated every 60s).
 * Falls back to the built-in demo catalog when Supabase isn't configured.
 * A configured-but-failing Supabase is an error, not a silent switch to demo data.
 */
export const loadCatalog = cache(async (): Promise<Catalog> => {
  const sb = createServerClient();
  if (!sb) return demoCatalog();

  const [categories, retailers, products, stats, brands] = await Promise.all([
    sb.from("categories").select("*").order("sort"),
    sb.from("retailers").select("*").order("sort"),
    sb.from("products").select("*, offers(*)").eq("published", true).order("sort").order("created_at"),
    sb.from("product_price_stats").select("*"),
    sb.from("brands").select("*").eq("published", true).order("sort").order("name"),
  ]);
  // The brands table arrives with migration 20261026000200; until it's applied, run without brand pages.
  const brandsMissing = brands.error && /brands|42P01|PGRST20/.test(`${brands.error.code} ${brands.error.message}`);
  const error = categories.error ?? retailers.error ?? products.error ?? stats.error ?? (brandsMissing ? null : brands.error);
  if (error) throw new Error(`Couldn't load the catalog from Supabase: ${error.message}`);

  const catalog = buildCatalog(categories.data!, retailers.data!, products.data!, stats.data!, brands.data ?? []);
  applyCatalog(catalog);
  return catalog;
});
