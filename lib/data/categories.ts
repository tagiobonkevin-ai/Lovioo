import type { CategoryId, Vibe } from "@/lib/types";

export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
  tint: string;
}

/** Demo-mode categories; replaced in place by the categories table when the catalogue loads from Supabase. */
export const CATEGORIES: Category[] = [
  { id: "electronics", name: "Gadgets & Electronics", emoji: "🎧", tint: "#FFE8F1" },
  { id: "fashion", name: "Fashion & Accessories", emoji: "👟", tint: "#FFE8F1" },
  { id: "beauty", name: "Beauty & Skincare", emoji: "💄", tint: "#FFE8F1" },
  { id: "home", name: "Home & Lifestyle", emoji: "🛋️", tint: "#FFE8F1" },
  { id: "gaming", name: "Gaming", emoji: "🎮", tint: "#FFE8F1" },
  { id: "sports", name: "Sports & Fitness", emoji: "🏸", tint: "#FFE8F1" },
  { id: "baby-kids", name: "Baby & Kids", emoji: "🧸", tint: "#FFE8F1" },
  { id: "essentials", name: "Everyday Essentials", emoji: "🧴", tint: "#FFE8F1" },
  { id: "toys", name: "Toys & Hobbies", emoji: "🧩", tint: "#FFE8F1" },
];

/** How a category looks on its photo card: one HD photo, a short label above the name and its one-line pitch. */
export interface CategoryArt {
  image: string;
  label: string;
  tagline: string;
}

/** Lovioo's own lifestyle photos, served from /public/images/home. */
const home = (name: string) => `/images/home/${name}.webp`;

/**
 * Photo cards for the category rows, in the brand's light pink. Keyed by category id, so the categories in Supabase
 * need no extra columns; a category without a photo keeps its emoji.
 */
const CATEGORY_ART: Record<string, CategoryArt> = {
  electronics: { image: home("phone-watch"), label: "Gadget crush", tagline: "Smart finds for smarter living." },
  fashion: { image: home("bag-sneakers"), label: "Style crush", tagline: "Your style. Your discovery." },
  beauty: { image: home("beauty-products"), label: "Beauty crush", tagline: "Find your next beauty favourite." },
  home: { image: home("living-room"), label: "Home crush", tagline: "Make every corner more you." },
  gaming: { image: home("gaming-tech"), label: "Game on", tagline: "Level up your discoveries." },
  sports: { image: home("sports"), label: "Active", tagline: "Find your motivation." },
  "baby-kids": { image: home("family-tablet"), label: "Little ones", tagline: "Little finds for little moments." },
  essentials: { image: home("kitchen"), label: "Daily crush", tagline: "The everyday things worth finding." },
};

/** The categories shoppers browse: the brand's eight, plus any other category once it has live products. */
export const browseCategories = (hasProducts: (id: CategoryId) => boolean) => CATEGORIES.filter((c) => c.id in CATEGORY_ART || hasProducts(c.id));

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
