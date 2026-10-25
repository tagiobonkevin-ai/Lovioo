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
