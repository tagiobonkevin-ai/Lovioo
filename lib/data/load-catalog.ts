import "server-only";
import { cache } from "react";
import { createServerClient } from "@/lib/supabase/client";
import { applyCatalog, demoCatalog, type Catalog } from "./catalog";
import { fetchCatalog } from "./fetch-catalog";
import { demoDeals, demoTeaser, fetchDeals, fetchTeaser, type Deal, type Teaser } from "./public-deals";

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

/** Today's front-page deals: the only products, and the only prices, a guest can see. */
export const loadDeals = cache(async (): Promise<Deal[]> => {
  const sb = createServerClient();
  return sb ? fetchDeals(sb, 24) : demoDeals(24);
});

/**
 * The no-price fallback for the front page: names and photos only. Used when loadDeals() comes back empty,
 * which is the case until real prices are entered in Admin -> Price list.
 */
export const loadTeaser = cache(async (): Promise<Teaser[]> => {
  const sb = createServerClient();
  return sb ? fetchTeaser(sb) : demoTeaser(12);
});
