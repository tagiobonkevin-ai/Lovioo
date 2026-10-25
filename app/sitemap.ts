import type { MetadataRoute } from "next";
import { loadCatalog } from "@/lib/data/load-catalog";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories, brands } = await loadCatalog();
  const now = new Date();
  const pages = ["", "/discover", "/swipe", "/search", "/brands", "/ai", "/terms", "/privacy", "/affiliate-disclosure", "/cookies"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
  }));
  return [
    ...pages,
    ...categories.map((c) => ({ url: `${SITE_URL}/search?category=${encodeURIComponent(c.id)}`, lastModified: now })),
    ...brands.map((b) => ({ url: `${SITE_URL}/brand/${b.id}`, lastModified: now })),
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, lastModified: now })),
  ];
}
