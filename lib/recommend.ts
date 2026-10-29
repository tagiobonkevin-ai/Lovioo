import { BUDGETS } from "@/lib/data/categories";
import { PRODUCTS, lowestPrice, productById } from "@/lib/data/products";
import { getInsight } from "@/lib/insights";
import type { Preferences, Product, Vibe } from "@/lib/types";
import { hashString } from "@/lib/utils";

interface Signals {
  prefs: Preferences;
  likedIds: string[];
  nopedIds?: string[];
}

/** Builds a taste profile from likes, then scores products against it and onboarding preferences. */
export function scoreProducts({ prefs, likedIds, nopedIds = [] }: Signals, products = PRODUCTS) {
  const liked = likedIds.map(productById).filter(Boolean) as Product[];
  const noped = nopedIds.map(productById).filter(Boolean) as Product[];
  const weight = new Map<string, number>();
  const bump = (k: string, v: number) => weight.set(k, (weight.get(k) ?? 0) + v);
  liked.forEach((p) => {
    bump("c:" + p.category, 3);
    bump("b:" + p.brand, 2);
    p.tags.forEach((t) => bump("t:" + t, 1));
    p.vibes.forEach((v) => bump("v:" + v, 1.5));
  });
  noped.forEach((p) => {
    bump("b:" + p.brand, -1);
    p.tags.forEach((t) => bump("t:" + t, -0.4));
  });
  const budgetMax = BUDGETS.find((b) => b.id === prefs.budget)?.max ?? Infinity;

  return products
    .map((p) => {
      let s = 0;
      if (prefs.interests.includes(p.category)) s += 4;
      if (p.offers.some((o) => prefs.platforms.includes(o.retailer))) s += 1;
      if (lowestPrice(p) <= budgetMax) s += 2;
      s += weight.get("c:" + p.category) ?? 0;
      s += weight.get("b:" + p.brand) ?? 0;
      p.tags.forEach((t) => (s += weight.get("t:" + t) ?? 0));
      p.vibes.forEach((v) => (s += weight.get("v:" + v) ?? 0));
      if (p.trending) s += 1.5;
      s += getInsight(p).dealScore / 40;
      s += (hashString(p.id) % 100) / 100; // stable tie-break so feeds don't look sorted
      return { p, s };
    })
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);
}

export function swipeFeed(signals: Signals, seen: Set<string>, vibe: Vibe | "under1k" | null) {
  let pool = PRODUCTS.filter((p) => !seen.has(p.id));
  if (vibe === "under1k") pool = pool.filter((p) => lowestPrice(p) <= 1000);
  else if (vibe) pool = pool.filter((p) => p.vibes.includes(vibe));
  // The deck is photo-first: products with a picture lead, emoji-only cards come after (order kept within each).
  const ranked = scoreProducts(signals, pool);
  const hasPhoto = (p: Product) => Boolean(p.image?.trim());
  return [...ranked.filter(hasPhoto), ...ranked.filter((p) => !hasPhoto(p))];
}

export function similarProducts(p: Product, n = 4) {
  return PRODUCTS.filter((x) => x.id !== p.id)
    .map((x) => ({
      x,
      s:
        (x.category === p.category ? 3 : 0) +
        (x.subcategory === p.subcategory ? 3 : 0) +
        (x.brand === p.brand ? 1 : 0) +
        x.tags.filter((t) => p.tags.includes(t)).length,
    }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((r) => r.x);
}
