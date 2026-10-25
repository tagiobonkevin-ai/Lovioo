import type { RetailerId } from "@/lib/types";

export interface Retailer {
  id: RetailerId;
  name: string;
  short: string;
  color: string;
  text: string;
  homepage: string;
  /** Inactive stores stay resolvable (old data, admin) but are hidden from shoppers. */
  active?: boolean;
  /** Store-level affiliate link, used when an offer has no product link yet. */
  affiliateUrl?: string;
}

export const RETAILERS: Record<RetailerId, Retailer> = {
  shopee: { id: "shopee", name: "Shopee", short: "S", color: "#EE4D2D", text: "#fff", homepage: "https://shopee.ph" },
  lazada: { id: "lazada", name: "Lazada", short: "L", color: "#2E1A8C", text: "#fff", homepage: "https://www.lazada.com.ph" },
  tiktok: { id: "tiktok", name: "TikTok Shop", short: "♪", color: "#111111", text: "#fff", homepage: "https://shop.tiktok.com" },
  amazon: { id: "amazon", name: "Amazon", short: "a", color: "#FF9900", text: "#111", homepage: "https://www.amazon.com" },
  ebay: { id: "ebay", name: "eBay", short: "e", color: "#0064D2", text: "#fff", homepage: "https://www.ebay.ph" },
  aliexpress: { id: "aliexpress", name: "AliExpress", short: "A", color: "#E62E04", text: "#fff", homepage: "https://www.aliexpress.com" },
  shein: { id: "shein", name: "SHEIN", short: "SH", color: "#222222", text: "#fff", homepage: "https://ph.shein.com" },
};

export const MAIN_RETAILERS: RetailerId[] = ["shopee", "lazada", "tiktok", "amazon"];
/** Active stores, in display order. Replaced in place when the catalog loads from Supabase. */
export const ALL_RETAILERS: RetailerId[] = Object.keys(RETAILERS);

export const retailerById = (id: RetailerId): Retailer =>
  RETAILERS[id] ?? { id, name: id, short: id.slice(0, 2).toUpperCase(), color: "#0F2742", text: "#fff", homepage: "" };

/** Store search pages, used when an offer has no real product link yet. */
const SEARCH_URLS: Record<string, (q: string) => string> = {
  shopee: (q) => `https://shopee.ph/search?keyword=${q}`,
  lazada: (q) => `https://www.lazada.com.ph/catalog/?q=${q}`,
  tiktok: (q) => `https://www.tiktok.com/search?q=${q}`,
  amazon: (q) => `https://www.amazon.com/s?k=${q}`,
  ebay: (q) => `https://www.ebay.com/sch/i.html?_nkw=${q}`,
  aliexpress: (q) => `https://www.aliexpress.com/wholesale?SearchText=${q}`,
  shein: (q) => `https://ph.shein.com/pdsearch/${q}/`,
};

/** True when an offer still has a seed/placeholder link instead of a real product page. */
export const isPlaceholderUrl = (url: string) => !/^https?:\/\//i.test(url) || /\/\/(www\.)?example\.com\//i.test(url);

/** Where "View at retailer" should go: the product page, or the store's search for the product. */
/** The store's own search page for a product, when we know its URL format. */
export function storeSearchHref(retailer: RetailerId, productName: string) {
  return SEARCH_URLS[retailer]?.(encodeURIComponent(productName));
}

export function offerHref(retailer: RetailerId, url: string, productName: string) {
  if (!isPlaceholderUrl(url)) return { href: url, isSearch: false };
  const affiliate = retailerById(retailer).affiliateUrl;
  if (affiliate) return { href: affiliate, isSearch: false, isAffiliate: true };
  const search = storeSearchHref(retailer, productName);
  if (search) return { href: search, isSearch: true };
  return { href: retailerById(retailer).homepage || "#", isSearch: true };
}
