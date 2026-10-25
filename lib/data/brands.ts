import type { Product, RetailerId } from "@/lib/types";
import { PRODUCTS } from "./products";

export interface Brand {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  cover: string;
  color: string;
  /** Official, Mall or affiliate store link. */
  storeUrl?: string;
  retailer?: RetailerId;
  featured: boolean;
  sort: number;
}

/** Same rule as the brand_partners migration, so ids match in demo and Supabase mode. */
export const brandSlug = (name: string) =>
  name.toLowerCase().replace(/['"’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const PALETTE = ["#FF2D9A", "#A855F7", "#FF6B4A", "#3B82F6", "#10B981", "#FFB84D", "#0F2742"];
// Demo mode only: a few brands shown as featured so Brand Crush has something to show.
const DEMO_FEATURED = ["nike", "laneige", "sony", "pop-mart", "uniqlo", "cosrx", "apple", "adidas"];

function demoBrands(): Brand[] {
  const names = Array.from(new Set(PRODUCTS.map((p) => p.brand))).filter((n) => n !== "Top sellers");
  return names.map((name, i) => {
    const id = brandSlug(name);
    const featured = DEMO_FEATURED.indexOf(id);
    return {
      id,
      name,
      tagline: "",
      description: "",
      logo: "",
      cover: "",
      color: PALETTE[i % PALETTE.length],
      featured: featured >= 0,
      sort: featured >= 0 ? featured : 100 + i,
    };
  });
}

/** All published brands. Swapped in place by applyCatalog() in Supabase mode, like PRODUCTS. */
export const BRAND_LIST: Brand[] = demoBrands();

export const brandById = (id: string | undefined) => (id ? BRAND_LIST.find((b) => b.id === id) : undefined);

/** The brand a product belongs to: its brand_id, or the brand matching its name. */
export const brandOf = (p: Product) => brandById(p.brandId) ?? brandById(brandSlug(p.brand));

export const brandProducts = (brand: Brand) => PRODUCTS.filter((p) => brandOf(p)?.id === brand.id);

/** Featured partners first, then by sort order and name. */
export const sortedBrands = () => [...BRAND_LIST].sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort - b.sort || a.name.localeCompare(b.name));

/** Brand Crush: featured partners, or the brands with the most products while none are featured yet. */
export function brandCrush(limit = 10) {
  const featured = sortedBrands().filter((b) => b.featured);
  if (featured.length) return { featured: true, brands: featured.slice(0, limit) };
  const counts = new Map<string, number>();
  PRODUCTS.forEach((p) => {
    const b = brandOf(p);
    if (b) counts.set(b.id, (counts.get(b.id) ?? 0) + 1);
  });
  const top = [...BRAND_LIST].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)).slice(0, limit);
  return { featured: false, brands: top };
}
