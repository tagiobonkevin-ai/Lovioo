import "server-only";
import { cache } from "react";
import { createServerClient } from "@/lib/supabase/client";
import { applyCatalog, demoCatalog, type Catalog } from "./catalog";
import { fetchCatalog } from "./fetch-catalog";
import { PRODUCTS } from "./products";
import { fetchTeaser, teaserFromProducts, type Teaser } from "./teaser";

/**
 * Loads the public part of the catalog (categories, stores, brands) once per request (pages are revalidated every 60s).
 * Products and prices are members-only: the browser loads them after sign-in (lib/data/member-catalog.ts).
 * Falls back to the built-in demo catalog when Supabase isn't configured.
 * A configured-but-failing Supabase is an error, not a silent switch to demo data.
 */
export const loadCatalog = cache(async (): Promise<Catalog> => {
  const sb = createServerClient();
  if (!sb) return demoCatalog();
  const catalog = await fetchCatalog(sb, { products: false });
  applyCatalog(catalog);
  return catalog;
});

/** The home page teaser for guests: product photos and names, no prices. */
export const loadTeaser = cache(async (): Promise<Teaser[]> => {
  const sb = createServerClient();
  return sb ? fetchTeaser(sb) : teaserFromProducts(PRODUCTS);
});
