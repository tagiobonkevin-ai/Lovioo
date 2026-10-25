import { notFound } from "next/navigation";
import { PRODUCTS, productBySlug } from "@/lib/data/products";
import { ProductDetail } from "./ProductDetail";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const p = productBySlug(params.slug);
  return { title: p ? `${p.name} · Lovioo` : "Not found · Lovioo" };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = productBySlug(params.slug);
  if (!product) notFound();
  return <ProductDetail slug={product.slug} />;
}
