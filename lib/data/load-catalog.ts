import "server-only";
import { cache } from "react";
import { createServerClient } from "@/lib/supabase/client";
import { applyCatalog, demoCatalog, type Catalog } from "./catalog";
import { fetchCatalog } from "./fetch-catalog";
import { PRODUCTS } from "./products";
import type { Product } from "@/lib/types";
import { demoDeals, demoTeaser, fetchDeals, fetchTeaser, type Deal, type Teaser } from "./public-deals";

/**
 * Loads the shared part of the catalog (categories, stores, brands) once per request (pages are revalidated every 60s).
 * Products and prices load in the browser for every visitor (lib/data/member-catalog.ts), keeping them out of each
 * page's HTML; the home page reads them on the server with loadHomeProducts().
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

/**
 * The whole published catalogue, for the home page's sections (Brand Crush, Trending, price discovery). Returned
 * rather than applied, so it never replaces the shared catalogue other server renders read.
 */
export const loadHomeProducts = cache(async (): Promise<Product[]> => {
  const sb = createServerClient();
  if (!sb) return [...PRODUCTS];
  return (await fetchCatalog(sb, { products: true })).products;
});

/** Today's front-page deals: products with a verified price and a discount. */
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
