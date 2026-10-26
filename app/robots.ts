import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Shopping screens are members-only (account required), so only the home and legal pages are for search engines.
const MEMBERS_ONLY = ["/discover", "/swipe", "/search", "/ai", "/brands", "/brand/", "/product/", "/compare"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/profile", "/saved", "/onboarding", "/auth", ...MEMBERS_ONLY] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
