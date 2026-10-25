import { retailerById } from "@/lib/data/retailers";

/** Links saved in the catalog must be https (the database enforces this too). */
export const isHttpsUrl = (s: string) => /^https:\/\/[^\s]+$/i.test(s.trim());

/** An error message for a non-empty link that isn't https, or null when it's fine. */
export const linkError = (label: string, url: string | null | undefined) =>
  url && url.trim() && !isHttpsUrl(url) ? `${label} must start with https://` : null;

// Hosts each store's product and affiliate links usually live on. Short-link domains vary, so a
// mismatch is only a warning.
const STORE_HOSTS: Record<string, string[]> = {
  shopee: ["shopee.ph", "shopee.com", "shp.ee"],
  lazada: ["lazada.com.ph", "lazada.com", "lzd.co"],
  tiktok: ["tiktok.com"],
  amazon: ["amazon.", "amzn.to", "amzn.asia"],
  ebay: ["ebay."],
  aliexpress: ["aliexpress."],
  shein: ["shein."],
};

/** A warning when a store link points somewhere other than that store, or null. */
export function storeLinkWarning(retailer: string, url: string) {
  const hosts = STORE_HOSTS[retailer];
  if (!hosts || !url.trim() || !isHttpsUrl(url)) return null;
  let host: string;
  try {
    host = new URL(url.trim()).hostname.toLowerCase();
  } catch {
    return null;
  }
  const ok = hosts.some((h) => (h.endsWith(".") ? host.includes(h) : host === h || host.endsWith(`.${h}`)));
  return ok ? null : `This link goes to ${host}, not ${retailerById(retailer).name}. Double-check it's the right store.`;
}
