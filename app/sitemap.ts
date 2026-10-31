import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Only public pages: the full catalogue and the shopping screens are for members (they need an account). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["", "/terms", "/privacy", "/affiliate-disclosure", "/cookies"].map((path) => ({ url: `${SITE_URL}${path}`, lastModified: now }));
}
