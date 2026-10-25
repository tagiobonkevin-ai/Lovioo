import { notFound } from "next/navigation";
import { brandById } from "@/lib/data/brands";
import { loadCatalog } from "@/lib/data/load-catalog";
import { BrandPage } from "./BrandPage";

export async function generateStaticParams() {
  const { brands } = await loadCatalog();
  return brands.map((b) => ({ slug: b.id }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  await loadCatalog();
  const b = brandById(params.slug);
  return b
    ? { title: `${b.name} on Lovioo — prices across stores`, description: b.tagline || `Shop ${b.name} and compare prices across Shopee, Lazada and more.` }
    : { title: "Brand not found · Lovioo" };
}

export default async function Page({ params }: { params: { slug: string } }) {
  await loadCatalog();
  if (!brandById(params.slug)) notFound();
  return <BrandPage slug={params.slug} />;
}
