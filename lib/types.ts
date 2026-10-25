export type CategoryId =
  | "electronics"
  | "fashion"
  | "beauty"
  | "home"
  | "sports"
  | "toys";

export type RetailerId =
  | "shopee"
  | "lazada"
  | "tiktok"
  | "amazon"
  | "ebay"
  | "aliexpress"
  | "shein";

export type Vibe = "cozy" | "glowup" | "gamer" | "sporty" | "street" | "workfromhome";

export interface Offer {
  retailer: RetailerId;
  price: number;
  originalPrice: number;
  shipping: number;
  inStock: boolean;
  url: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
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
}

export interface PricePoint {
  date: string;
  label: string;
  price: number;
}

export interface Insight {
  dealScore: number;
  verdict: "buy" | "wait" | "good";
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
