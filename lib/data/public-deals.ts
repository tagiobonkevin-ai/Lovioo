import type { Supabase } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";
import { PRODUCTS } from "./products";

/** A product the front page may show to anyone, price included (public_deals(), migration 20261102000100). */
export interface Deal {
  slug: string;
  name: string;
  brand: string;
  brandId: string | null;
  category: string;
  image: string;
  emoji: string;
  price: number;
  originalPrice: number;
  retailer: string;
  /** Whole percent off, worked out here rather than trusted from the database. */
  off: number;
  tags: string[];
}

/** A brand with something on sale: "Nike — up to 50% off". Grouped from the deals, so it needs no extra query. */
export interface BrandDeal {
  id: string;
  name: string;
  off: number;
  count: number;
  image: string;
}

const pct = (price: number, was: number) => (was > price && was > 0 ? Math.round(((was - price) / was) * 100) : 0);

export const brandDeals = (deals: Deal[], max = 8): BrandDeal[] => {
  const by = new Map<string, BrandDeal>();
  for (const d of deals) {
    if (!d.off) continue;
    const key = d.brandId || d.brand;
    const found = by.get(key);
    if (found) {
      found.off = Math.max(found.off, d.off);
      found.count += 1;
      found.image ||= d.image;
    } else by.set(key, { id: d.brandId || "", name: d.brand, off: d.off, count: 1, image: d.image });
  }
  return [...by.values()].sort((a, b) => b.off - a.off || b.count - a.count).slice(0, max);
};

/** Demo mode: the built-in catalogue stands in for the public deals. */
export const demoDeals = (want = 24): Deal[] =>
  PRODUCTS.filter((p) => p.priceTracked !== false && p.offers.length)
    .map((p) => {
      const best = [...p.offers].sort((a, b) => pct(b.price, b.originalPrice) - pct(a.price, a.originalPrice) || a.price - b.price)[0];
      return {
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        brandId: p.brandId ?? null,
        category: p.category,
        image: p.image,
        emoji: p.emoji,
        price: best.price,
        originalPrice: best.originalPrice,
        retailer: best.retailer,
        off: pct(best.price, best.originalPrice),
        tags: p.tags,
      };
    })
    .sort((a, b) => b.off - a.off)
    .slice(0, want);

/** The deals guests may see. Everything else in the catalogue needs an account. */
export async function fetchDeals(sb: Supabase, want = 24): Promise<Deal[]> {
  const { data, error } = await sb.rpc("public_deals", { want });
  if (error) {
    console.error("Lovioo deals:", error.message);
    return [];
  }
  return (data ?? []).map((d) => ({
    slug: d.slug,
    name: d.name,
    brand: d.brand,
    brandId: d.brand_id,
    category: d.category_id,
    image: d.image,
    emoji: d.emoji,
    price: Number(d.price),
    originalPrice: Number(d.original_price),
    retailer: d.retailer_id,
    off: pct(Number(d.price), Number(d.original_price)),
    tags: d.tags ?? [],
  }));
}

/**
 * Deals as Products, so the guest assistant can search them with the same code the signed-in app uses
 * (lib/ai.ts). Only the fields the assistant and the deal cards read are filled in.
 */
export const dealsAsProducts = (deals: Deal[]): Product[] =>
  deals.map((d, i) => ({
    id: `deal-${i}`,
    slug: d.slug,
    name: d.name,
    brand: d.brand,
    brandId: d.brandId ?? undefined,
    category: d.category as Product["category"],
    subcategory: "",
    emoji: d.emoji,
    image: d.image,
    tags: d.tags,
    vibes: [],
    rating: 0,
    reviewCount: 0,
    description: "",
    highlights: [],
    offers: [{ retailer: d.retailer as Product["offers"][number]["retailer"], price: d.price, originalPrice: d.originalPrice, shipping: 0, inStock: true, url: "" }],
    stats: { low90: d.price, avg90: d.price, high90: d.originalPrice || d.price, days: 0 },
  }));

/**
 * A product a guest may see when there are no real prices to show yet: photo, brand and name, no money.
 * Comes from product_teaser() (migration 20261031000100), which never returns a price.
 */
export interface Teaser {
  name: string;
  brand: string;
  image: string;
  emoji: string;
  category: string;
}

/** Demo mode: the built-in catalogue stands in for the teaser. */
export const demoTeaser = (want = 12): Teaser[] =>
  PRODUCTS.slice(0, want).map((p) => ({ name: p.name, brand: p.brand, image: p.image, emoji: p.emoji, category: p.category }));

/**
 * What a guest sees while the catalogue has no verified prices. Names and photos only, so the front page
 * is never bare and never quotes a number we can't stand behind.
 */
export async function fetchTeaser(sb: Supabase): Promise<Teaser[]> {
  const { data, error } = await sb.rpc("product_teaser");
  if (error) {
    console.error("Lovioo teaser:", error.message);
    return [];
  }
  return (data ?? []).map((t) => ({ name: t.name, brand: t.brand, image: t.image, emoji: t.emoji, category: t.category_id }));
}
