import type { RetailerId } from "@/lib/types";

export interface Retailer {
  id: RetailerId;
  name: string;
  short: string;
  color: string;
  text: string;
  homepage: string;
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
export const ALL_RETAILERS = Object.keys(RETAILERS) as RetailerId[];
