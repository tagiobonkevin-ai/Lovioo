import { brandOf } from "@/lib/data/brands";
import { PRODUCTS, isPriced, lowestPrice } from "@/lib/data/products";
import { getInsight } from "@/lib/insights";
import { scoreProducts } from "@/lib/recommend";
import type { Preferences, Product } from "@/lib/types";
import { hashString } from "@/lib/utils";

/** What a collection may use about the visitor: only Smart Crush reads it, from their own swipes and interests. */
export interface CrushContext {
  prefs: Preferences;
  likedIds: string[];
  nopedIds: string[];
}

/**
 * A Brand Crush collection: Lovioo's recurring editorial series. Every rule reads real catalogue fields (featured
 * brands, the Trending flag set in Admin, categories, verified prices) — never invented popularity.
 */
export interface Crush {
  slug: string;
  title: string;
  tagline: string;
  /** Longer line for the collection page and its search-engine description. */
  description: string;
  emoji: string;
  /** The editorial series shown on /crush; the rest are category crushes used on the home page. */
  series: boolean;
  pick: (products: Product[], ctx?: CrushContext) => Product[];
}

const byDeal = (a: Product, b: Product) => getInsight(b).dealScore - getInsight(a).dealScore;
const inCategories = (...ids: string[]) => (products: Product[]) => products.filter((p) => ids.includes(p.category)).sort(byDeal);
/** Today's date in the Philippines, so the Daily Crush turns over at local midnight. */
const manilaDay = () => new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);

export const CRUSHES: Crush[] = [
  {
    slug: "brand-crush",
    title: "Brand Crush",
    tagline: "Products worth falling in love with.",
    description: "Finds from the brands we're crushing on right now, picked by the Lovioo team.",
    emoji: "💘",
    series: true,
    pick: (ps) => ps.filter((p) => brandOf(p)?.featured).sort(byDeal),
  },
  {
    slug: "budget-crush",
    title: "Budget Crush",
    tagline: "Amazing discoveries within your budget.",
    description: "Great finds at ₱1,000 or less, cheapest first. Prices are each store's own and can change.",
    emoji: "🪙",
    series: true,
    pick: (ps) => ps.filter((p) => isPriced(p) && lowestPrice(p) <= 1000).sort((a, b) => lowestPrice(a) - lowestPrice(b)),
  },
  {
    slug: "trend-crush",
    title: "Trend Crush",
    tagline: "What's catching everyone's attention.",
    description: "The products the Lovioo team has marked as trending right now.",
    emoji: "🔥",
    series: true,
    pick: (ps) => ps.filter((p) => p.trending).sort(byDeal),
  },
  {
    slug: "tech-crush",
    title: "Tech Crush",
    tagline: "The gadgets worth discovering.",
    description: "Gadgets, electronics and gaming finds worth a closer look.",
    emoji: "🎧",
    series: true,
    pick: inCategories("electronics", "gaming"),
  },
  {
    slug: "hidden-crush",
    title: "Hidden Crush",
    tagline: "Interesting finds you might not have discovered yet.",
    description: "Products that aren't on the trending list yet — the best deals first.",
    emoji: "💎",
    series: true,
    pick: (ps) => ps.filter((p) => !p.trending).sort(byDeal),
  },
  {
    slug: "daily-crush",
    title: "Daily Crush",
    tagline: "Your daily dose of inspiration.",
    description: "A fresh set of finds every day, picked from the whole catalogue.",
    emoji: "☀️",
    series: true,
    pick: (ps) => {
      const day = manilaDay();
      return ps
        .filter((p) => p.image?.trim())
        .sort((a, b) => hashString(a.id + day) - hashString(b.id + day))
        .slice(0, 12);
    },
  },
  {
    slug: "style-crush",
    title: "Style Crush",
    tagline: "Fashion, beauty and personal style.",
    description: "Fashion, accessories and beauty finds to make your look yours.",
    emoji: "👟",
    series: true,
    pick: inCategories("fashion", "beauty"),
  },
  {
    slug: "smart-crush",
    title: "Smart Crush",
    tagline: "Picked for you from what you love.",
    description: "Ranked for you from your swipes, saves and interests — the more you swipe, the sharper it gets.",
    emoji: "✨",
    series: true,
    pick: (ps, ctx) => (ctx ? scoreProducts(ctx, ps) : [...ps].sort(byDeal)),
  },
  // Category crushes for the home page's Brand Crush row.
  {
    slug: "gadget-crush",
    title: "Gadget Crush",
    tagline: "Tech worth getting excited about.",
    description: "Gadgets and electronics worth getting excited about.",
    emoji: "🎧",
    series: false,
    pick: inCategories("electronics", "gaming"),
  },
  {
    slug: "beauty-crush",
    title: "Beauty Crush",
    tagline: "Your next beauty obsession.",
    description: "Skincare and beauty finds for your next obsession.",
    emoji: "💄",
    series: false,
    pick: inCategories("beauty"),
  },
  {
    slug: "home-crush",
    title: "Home Crush",
    tagline: "Little upgrades, better living.",
    description: "Home and lifestyle finds — little upgrades for better living.",
    emoji: "🛋️",
    series: false,
    pick: inCategories("home"),
  },
];

export const crushBySlug = (slug: string) => CRUSHES.find((c) => c.slug === slug);

/** The products in a collection right now, from the loaded catalogue. */
export const crushProducts = (crush: Crush, ctx?: CrushContext, products: Product[] = PRODUCTS) => crush.pick([...products], ctx);

/** One product as a story slide carries it: just what the slide shows. */
export interface StoryProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  emoji: string;
  /** Only when the price is verified. */
  price?: number;
}

export interface CrushStory {
  slug: string;
  title: string;
  tagline: string;
  emoji: string;
  products: StoryProduct[];
}

const STORY_ORDER = ["trend-crush", "daily-crush", "brand-crush", "budget-crush", "style-crush", "tech-crush", "hidden-crush"];

/** Crush Stories: one story per editorial collection that has products, up to five product slides each. */
export function crushStories(products: Product[] = PRODUCTS): CrushStory[] {
  return STORY_ORDER.map((slug) => crushBySlug(slug)!)
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      tagline: c.tagline,
      emoji: c.emoji,
      products: crushProducts(c, undefined, products)
        .slice(0, 5)
        .map((p) => ({ id: p.id, slug: p.slug, name: p.name, brand: p.brand, image: p.image, emoji: p.emoji, price: isPriced(p) ? lowestPrice(p) : undefined })),
    }))
    .filter((s) => s.products.length > 0);
}
