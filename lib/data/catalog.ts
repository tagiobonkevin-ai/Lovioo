import type { Database } from "@/lib/supabase/database.types";
import type { Offer, Product } from "@/lib/types";
import { BRAND_LIST, type Brand } from "./brands";
import { CATEGORIES, type Category } from "./categories";
import { BRANDS, PRODUCTS } from "./products";
import { ALL_RETAILERS, RETAILERS, type Retailer } from "./retailers";

export interface Catalog {
  source: "supabase" | "demo";
  products: Product[];
  categories: Category[];
  retailers: Retailer[];
  brands: Brand[];
}

type Tables = Database["public"]["Tables"];
type ProductRow = Tables["products"]["Row"] & { offers: Tables["offers"]["Row"][] };
type StatsRow = Database["public"]["Views"]["product_price_stats"]["Row"];

const listeners = new Set<() => void>();
export const onCatalogChange = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/**
 * The data modules export plain arrays/records that the whole app reads synchronously.
 * Loading the Supabase catalog swaps their contents in place so every import sees it.
 */
export function applyCatalog(c: Catalog) {
  if (c.source === "demo") return;
  CATEGORIES.splice(0, CATEGORIES.length, ...c.categories);
  for (const k of Object.keys(RETAILERS)) delete RETAILERS[k];
  c.retailers.forEach((r) => (RETAILERS[r.id] = r));
  ALL_RETAILERS.splice(0, ALL_RETAILERS.length, ...c.retailers.filter((r) => r.active !== false).map((r) => r.id));
  PRODUCTS.splice(0, PRODUCTS.length, ...c.products);
  BRAND_LIST.splice(0, BRAND_LIST.length, ...c.brands);
  BRANDS.splice(0, BRANDS.length, ...Array.from(new Set(c.products.map((p) => p.brand))).sort());
  listeners.forEach((fn) => fn());
}

export const demoCatalog = (): Catalog => ({
  source: "demo",
  products: PRODUCTS,
  categories: CATEGORIES,
  retailers: Object.values(RETAILERS),
  brands: BRAND_LIST,
});

export function mapBrand(b: Tables["brands"]["Row"]): Brand {
  return {
    id: b.id,
    name: b.name,
    tagline: b.tagline,
    description: b.description,
    logo: b.logo_url,
    cover: b.cover_url,
    color: b.color,
    storeUrl: b.store_url ?? undefined,
    retailer: b.retailer_id ?? undefined,
    featured: b.featured,
    sort: b.sort,
  };
}

export function mapRetailer(r: Tables["retailers"]["Row"]): Retailer {
  return { id: r.id, name: r.name, short: r.short, color: r.color, text: r.text_color, homepage: r.homepage ?? "", active: r.active, affiliateUrl: r.affiliate_url ?? undefined };
}

export function mapOffer(o: Tables["offers"]["Row"]): Offer {
  return { retailer: o.retailer_id, price: o.price, originalPrice: o.original_price, shipping: o.shipping, inStock: o.in_stock, url: o.url, updatedAt: o.updated_at };
}

/** Maps a product row (with offers) to the app's Product. Offers from inactive stores are dropped. */
export function mapProduct(row: ProductRow, stats: StatsRow | undefined, activeRetailers: Set<string>): Product {
  const offers = row.offers.filter((o) => activeRetailers.has(o.retailer_id)).map(mapOffer);
  const lowestNow = offers.length ? Math.min(...offers.map((o) => o.price)) : 0;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    brandId: row.brand_id ?? undefined,
    category: row.category_id,
    subcategory: row.subcategory,
    emoji: row.emoji,
    image: row.image,
    tags: row.tags,
    vibes: row.vibes as Product["vibes"],
    rating: Number(row.rating),
    reviewCount: row.review_count,
    description: row.description,
    highlights: row.highlights,
    isNew: row.is_new,
    trending: row.trending,
    offers,
    priceTracked: row.price_tracked,
    // No history yet means "just started tracking" — never the demo-mode price generator.
    stats:
      stats?.low_90 != null && stats.avg_90 != null && stats.high_90 != null
        ? { low90: stats.low_90, avg90: stats.avg_90, high90: stats.high_90, days: stats.days ?? 0 }
        : { low90: lowestNow, avg90: lowestNow, high90: lowestNow, days: 0 },
  };
}

export function buildCatalog(
  categories: Tables["categories"]["Row"][],
  retailers: Tables["retailers"]["Row"][],
  products: ProductRow[],
  stats: StatsRow[],
  brands: Tables["brands"]["Row"][] = [],
): Catalog {
  const mappedRetailers = retailers.map(mapRetailer);
  const active = new Set(mappedRetailers.filter((r) => r.active).map((r) => r.id));
  const statsById = new Map(stats.map((s) => [s.product_id, s]));
  return {
    source: "supabase",
    categories: categories.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji, tint: c.tint })),
    retailers: mappedRetailers,
    brands: brands.filter((b) => b.published).map(mapBrand),
    // A product with no offers from an active store can't be shown or priced.
    products: products.map((p) => mapProduct(p, statsById.get(p.id), active)).filter((p) => p.offers.length > 0),
  };
}
