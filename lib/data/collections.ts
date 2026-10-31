import type { Supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type { Product } from "@/lib/types";
import { PRODUCTS } from "./products";

type Row = Database["public"]["Tables"]["collections"]["Row"];

/** A collection curated in Admin -> Collections: its wording, where it shows, and its products in order. */
export interface Collection {
  id: string;
  title: string;
  tagline: string;
  eyebrow: string;
  description: string;
  emoji: string;
  cover: string;
  inStories: boolean;
  inBrandCrush: boolean;
  inTodaysFinds: boolean;
  sort: number;
  /** Product ids in the admin's order. Members only: guests get the home page preview instead. */
  productIds: string[];
}

/** A collection with its products resolved, ready for the home page and the app to show. */
export type ResolvedCollection = Omit<Collection, "productIds"> & { products: Product[] };

/** Published collections. Swapped in place when the catalogue loads, like PRODUCTS. */
export const COLLECTIONS: Collection[] = [];

export function mapCollection(r: Row, productIds: string[] = []): Collection {
  return {
    id: r.id,
    title: r.title,
    tagline: r.tagline,
    eyebrow: r.eyebrow,
    description: r.description,
    emoji: r.emoji,
    cover: r.cover_url,
    inStories: r.in_stories,
    inBrandCrush: r.in_brand_crush,
    inTodaysFinds: r.in_todays_finds,
    sort: r.sort,
    productIds,
  };
}

export const collectionById = (id: string) => COLLECTIONS.find((c) => c.id === id);

/** The loaded collections with their products, skipping any product this visitor can't see. */
export function resolveCollections(cols: Collection[] = COLLECTIONS, products: Product[] = PRODUCTS): ResolvedCollection[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return cols.map(({ productIds, ...c }) => ({ ...c, products: productIds.map((id) => byId.get(id)).filter((p): p is Product => !!p) }));
}

interface PreviewItem {
  slug: string;
  name: string;
  brand: string;
  brand_id: string | null;
  category_id: string;
  image: string;
  emoji: string;
  trending: boolean;
  is_new: boolean;
  price: number | null;
  original_price: number | null;
  retailer_id: string | null;
}

/**
 * The home page's collections for guests, from public_collections(): the curated wording plus a preview of each
 * collection's products. Preview products carry "deal-" ids, so hearts on them invite a guest to join instead of saving.
 */
export async function fetchPublicCollections(sb: Supabase): Promise<ResolvedCollection[]> {
  const { data, error } = await sb.rpc("public_collections");
  if (error) {
    // Before the collections migration (or on a hiccup) the home page simply falls back to its automatic sections.
    console.error("Lovioo collections:", error.message);
    return [];
  }
  return (data ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    tagline: c.tagline,
    eyebrow: c.eyebrow,
    description: c.description,
    emoji: c.emoji,
    cover: c.cover_url,
    inStories: c.in_stories,
    inBrandCrush: c.in_brand_crush,
    inTodaysFinds: c.in_todays_finds,
    sort: c.sort,
    products: ((c.items as unknown as PreviewItem[]) ?? []).map((it, i) => previewProduct(c.id, it, i)),
  }));
}

function previewProduct(collection: string, it: PreviewItem, i: number): Product {
  const priced = it.price != null && it.retailer_id != null;
  return {
    id: `deal-${collection}-${i}`,
    slug: it.slug,
    name: it.name,
    brand: it.brand,
    brandId: it.brand_id ?? undefined,
    category: it.category_id as Product["category"],
    subcategory: "",
    emoji: it.emoji,
    image: it.image,
    tags: [],
    vibes: [],
    rating: 0,
    reviewCount: 0,
    description: "",
    highlights: [],
    trending: it.trending,
    isNew: it.is_new,
    priceTracked: priced,
    offers: priced
      ? [{ retailer: it.retailer_id as Product["offers"][number]["retailer"], price: Number(it.price), originalPrice: Number(it.original_price ?? it.price), shipping: 0, inStock: true, url: "" }]
      : [{ retailer: "shopee", price: 0, originalPrice: 0, shipping: 0, inStock: true, url: "" }],
    stats: { low90: Number(it.price ?? 0), avg90: Number(it.price ?? 0), high90: Number(it.original_price ?? it.price ?? 0), days: 0 },
  };
}
