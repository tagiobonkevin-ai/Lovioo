import { notFound } from "next/navigation";
import { CRUSHES, crushBySlug } from "@/lib/data/crush";
import { CrushPage } from "./CrushPage";

export function generateStaticParams() {
  return CRUSHES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const c = crushBySlug(params.slug);
  return c ? { title: `${c.title}: ${c.tagline} · Lovioo`, description: c.description } : { title: "Collection not found · Lovioo" };
}

export default function Page({ params }: { params: { slug: string } }) {
  if (!crushBySlug(params.slug)) notFound();
  return <CrushPage slug={params.slug} />;
}
