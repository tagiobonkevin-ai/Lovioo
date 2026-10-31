import { COLLECTIONS } from "@/lib/data/collections";
import { CRUSHES, crushBySlug } from "@/lib/data/crush";
import { loadCatalog } from "@/lib/data/load-catalog";
import { CrushPage } from "./CrushPage";

export async function generateStaticParams() {
  await loadCatalog();
  return [...new Set([...COLLECTIONS.map((c) => c.id), ...CRUSHES.map((c) => c.slug)])].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  await loadCatalog();
  const c = crushBySlug(params.slug);
  return c ? { title: `${c.title}${c.tagline ? `: ${c.tagline}` : ""} · Lovioo`, description: c.description } : { title: "Collection · Lovioo", robots: { index: false } };
}

/**
 * Collection pages are for members, so CrushPage looks the collection up in the browser once the member catalogue
 * has loaded. That way a collection made in Admin a moment ago opens straight away, and an unknown link shows a
 * friendly "not found" there.
 */
export default function Page({ params }: { params: { slug: string } }) {
  return <CrushPage slug={params.slug} />;
}
