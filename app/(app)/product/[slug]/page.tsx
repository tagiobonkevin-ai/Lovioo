import { notFound } from "next/navigation";
import { loadCatalog } from "@/lib/data/load-catalog";
import { productBySlug } from "@/lib/data/products";
import { ProductDetail } from "./ProductDetail";

export async function generateStaticParams() {
  const { products } = await loadCatalog();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  await loadCatalog();
  const p = productBySlug(params.slug);
  return { title: p ? `${p.name} · Lovioo` : "Not found · Lovioo" };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  await loadCatalog();
  const product = productBySlug(params.slug);
  if (!product) notFound();
  return <ProductDetail slug={product.slug} />;
}
