// Known ids get autocomplete; admins can add more in Supabase, so any string is allowed.
export type CategoryId = "electronics" | "fashion" | "beauty" | "home" | "sports" | "toys" | (string & {});

export type RetailerId = "shopee" | "lazada" | "tiktok" | "amazon" | "ebay" | "aliexpress" | "shein" | (string & {});

export type Vibe = "cozy" | "glowup" | "gamer" | "sporty" | "street" | "workfromhome";

export interface Offer {
  retailer: RetailerId;
  price: number;
  originalPrice: number;
  shipping: number;
  inStock: boolean;
  url: string;
  /** When this offer was last updated (Supabase mode). */
  updatedAt?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  /** Brand page id (brands table); falls back to the brand name's slug. */
  brandId?: string;
  category: CategoryId;
  subcategory: string;
  emoji: string;
  image: string;
  tags: string[];
  vibes: Vibe[];
  rating: number;
  reviewCount: number;
  description: string;
  highlights: string[];
  isNew?: boolean;
  trending?: boolean;
  offers: Offer[];
  /** false: a "See prices" pick — offers have no tracked price and shoppers compare on the store. */
  priceTracked?: boolean;
  /** 90-day stats on the lowest daily price, from Supabase. Absent in demo mode. */
  stats?: PriceStats;
}

export interface PriceStats {
  low90: number;
  avg90: number;
  high90: number;
  /** How many days of history the stats cover. */
  days: number;
}

export interface PricePoint {
  date: string;
  label: string;
  price: number;
}

export interface Insight {
  dealScore: number;
  /** "new": not enough real price history yet to call buy or wait. */
  verdict: "buy" | "wait" | "good" | "new";
  /** false for "See prices" picks: no price, score or savings to show. */
  priced: boolean;
  headline: string;
  reason: string;
  bestOffer: Offer;
  lowest90: number;
  avg90: number;
  savings: number;
}

export interface PriceAlert {
  productId: string;
  targetPrice: number;
  enabled: boolean;
  createdAt: number;
}

export interface Preferences {
  interests: CategoryId[];
  budget: "under500" | "500to2000" | "2000to10000" | "over10000" | null;
  platforms: RetailerId[];
}
