import type { CategoryId, Vibe } from "@/lib/types";

export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
  tint: string;
}

export const CATEGORIES: Category[] = [
  { id: "electronics", name: "Electronics", emoji: "🎧", tint: "#E0ECFF" },
  { id: "fashion", name: "Fashion", emoji: "👟", tint: "#FFE3EC" },
  { id: "beauty", name: "Beauty & Skincare", emoji: "💄", tint: "#FFE9F5" },
  { id: "home", name: "Home & Living", emoji: "🛋️", tint: "#FFF0DE" },
  { id: "sports", name: "Sports & Outdoors", emoji: "🏸", tint: "#E3F7EC" },
  { id: "toys", name: "Toys & Hobbies", emoji: "🧸", tint: "#F1E8FF" },
];

/** How a category looks on its photo card: one HD photo, its own colour and a short label above the name. */
export interface CategoryArt {
  image: string;
  bg: string;
  fg: string;
  label: string;
}

// Free-licence Unsplash photos (no attribution required), cropped portrait by Unsplash's image CDN.
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=640&h=800&q=75`;

/**
 * Photo cards for the category rows, after daydream's: deep, earthy card colours with cream text. Keyed by
 * category id, so the categories in Supabase need no extra columns; a category without art keeps its emoji tile.
 */
const CATEGORY_ART: Record<string, CategoryArt> = {
  electronics: { image: unsplash("1505740420928-5e560c06d30e"), bg: "#26354B", fg: "#E4E3DA", label: "Gadgets" },
  fashion: { image: unsplash("1542291026-7eec264c27ff"), bg: "#B24B32", fg: "#F0E1C9", label: "Style" },
  beauty: { image: unsplash("1556228578-8c89e6adf883"), bg: "#8E4A5C", fg: "#F6E6E4", label: "Glow" },
  home: { image: unsplash("1555041469-a586c61ea9bc"), bg: "#9B7530", fg: "#F2E7CD", label: "Cozy" },
  sports: { image: unsplash("1626224583764-f87db24ac4ea"), bg: "#2B4638", fg: "#F2E7CD", label: "Active" },
  toys: { image: unsplash("1587654780291-39c9404d746b"), bg: "#315174", fg: "#E4E3DA", label: "Play" },
  family: { image: unsplash("1543466835-00a7907e9de1"), bg: "#CDAA92", fg: "#2B1F17", label: "Pets & kids" },
};

export const categoryArt = (id: CategoryId): CategoryArt | undefined => CATEGORY_ART[id];

export const categoryById = (id: CategoryId): Category =>
  CATEGORIES.find((c) => c.id === id) ?? { id, name: id, emoji: "✨", tint: "#FFE9E2" };

export const VIBES: { id: Vibe; label: string; emoji: string }[] = [
  { id: "cozy", label: "Cozy", emoji: "🕯️" },
  { id: "glowup", label: "Glow-up", emoji: "✨" },
  { id: "gamer", label: "Gamer", emoji: "🎮" },
  { id: "sporty", label: "Sporty", emoji: "⚡" },
  { id: "street", label: "Street", emoji: "🛹" },
  { id: "workfromhome", label: "WFH", emoji: "💻" },
];

export const BUDGETS = [
  { id: "under500", label: "Under ₱500", max: 500 },
  { id: "500to2000", label: "₱500 – ₱2,000", max: 2000 },
  { id: "2000to10000", label: "₱2,000 – ₱10,000", max: 10000 },
  { id: "over10000", label: "₱10,000+", max: Infinity },
] as const;
