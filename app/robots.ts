import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Browsing is open to everyone, so search engines may read the shopping pages; personal and admin pages stay out.
const PRIVATE = ["/admin", "/profile", "/saved", "/onboarding", "/auth", "/compare", "/ai"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
