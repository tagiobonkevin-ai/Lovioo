import type { MetadataRoute } from "next";
import { CRUSHES } from "@/lib/data/crush";
import { SITE_URL } from "@/lib/site";

/** The public pages: home, browsing, every Brand Crush collection and the legal pages. Personal pages stay out. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = ["", "/discover", "/swipe", "/search", "/brands", "/crush", ...CRUSHES.map((c) => `/crush/${c.slug}`), "/terms", "/privacy", "/affiliate-disclosure", "/cookies"];
  return paths.map((path) => ({ url: `${SITE_URL}${path}`, lastModified: now }));
}
