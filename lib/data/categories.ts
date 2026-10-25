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
