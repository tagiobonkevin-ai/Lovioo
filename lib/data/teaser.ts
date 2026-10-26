import type { Supabase } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

/** What a guest may see of a product: photo, brand and name. Never prices, offers or links. */
export type Teaser = Pick<Product, "name" | "brand" | "image" | "emoji" | "category">;

/** Demo mode: the built-in products, with photos first and everything but the teaser fields dropped. */
export function teaserFromProducts(products: Product[]): Teaser[] {
  const sorted = [...products.filter((p) => p.image), ...products.filter((p) => !p.image)];
  return sorted.slice(0, 40).map(({ name, brand, image, emoji, category }) => ({ name, brand, image, emoji, category }));
}

/** Supabase: product_teaser() is the only product data guests can read (migration 20261031000100). */
export async function fetchTeaser(sb: Supabase): Promise<Teaser[]> {
  const { data, error } = await sb.rpc("product_teaser");
  if (error) {
    console.error("Lovioo teaser:", error.message);
    return [];
  }
  return (data ?? []).map((t) => ({ name: t.name, brand: t.brand, image: t.image, emoji: t.emoji, category: t.category_id }));
}
