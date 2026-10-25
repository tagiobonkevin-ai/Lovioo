"use client";

import { Star, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DealScoreRing } from "@/components/product/DealScore";
import { ProductImage } from "@/components/product/ProductImage";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { categoryById } from "@/lib/data/categories";
import { productById } from "@/lib/data/products";
import { RETAILERS } from "@/lib/data/retailers";
import { getInsight } from "@/lib/insights";
import { useLovioo } from "@/lib/store";
import type { Product } from "@/lib/types";
import { cn, compact, peso } from "@/lib/utils";

function CompareInner() {
  const params = useSearchParams();
  const router = useRouter();
  const toggleCompare = useLovioo((s) => s.toggleCompare);
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean);
  const products = ids.map(productById).filter(Boolean) as Product[];

  if (!products.length) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <span className="text-5xl">⚖️</span>
        <h1 className="mt-3 text-xl font-bold">Nothing to compare yet</h1>
        <p className="mt-1 text-sm text-midnight/60">Tap “Compare” on up to 3 products and they&apos;ll line up here side by side.</p>
        <Link href="/search" className="btn-primary mt-5">
          Browse products
        </Link>
      </div>
    );
  }

  const insights = products.map(getInsight);
  const bestIdx = insights.reduce((b, ins, i) => (ins.dealScore > insights[b].dealScore ? i : b), 0);
  const cheapestIdx = insights.reduce((b, ins, i) => (ins.bestOffer.price < insights[b].bestOffer.price ? i : b), 0);

  const rows: { label: string; render: (p: Product, i: number) => React.ReactNode }[] = [
    { label: "Best price", render: (_, i) => <span className={cn("text-lg font-extrabold", i === cheapestIdx && "text-emerald-600")}>{peso(insights[i].bestOffer.price)}</span> },
    { label: "Best store", render: (_, i) => <RetailerBadge id={insights[i].bestOffer.retailer} withName /> },
    { label: "Deal score", render: (_, i) => <DealScoreRing score={insights[i].dealScore} size={48} /> },
    { label: "AI verdict", render: (_, i) => <span className="text-sm font-semibold">{insights[i].headline}</span> },
    { label: "90-day low", render: (_, i) => peso(insights[i].lowest90) },
    {
      label: "Rating",
      render: (p) => (
        <span className="inline-flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 fill-sunset text-sunset" /> {p.rating} ({compact(p.reviewCount)})
        </span>
      ),
    },
    { label: "Category", render: (p) => `${categoryById(p.category).name} · ${p.subcategory}` },
    { label: "Stores", render: (p) => p.offers.map((o) => RETAILERS[o.retailer].name).join(", ") },
  ];

  const remove = (id: string) => {
    toggleCompare(id);
    router.replace(`/compare?ids=${ids.filter((x) => x !== id).join(",")}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Side-by-side compare</h1>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 overflow-hidden rounded-3xl bg-white shadow-soft">
          <thead>
            <tr>
              <th className="w-40 border-b border-line p-4" />
              {products.map((p, i) => (
                <th key={p.id} className="relative border-b border-line p-4 text-left align-top font-normal">
                  <button onClick={() => remove(p.id)} className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-cream" aria-label={`Remove ${p.name}`}>
                    <X className="h-4 w-4" />
                  </button>
                  {i === bestIdx && <span className="mb-2 inline-block rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold text-white">LOVIOO PICK</span>}
                  <ProductImage product={p} className="aspect-square w-28 rounded-2xl" emojiSize="text-5xl" />
                  <Link href={`/product/${p.slug}`} className="mt-2 line-clamp-2 block text-sm font-bold hover:text-pink">
                    {p.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="border-b border-line/60 p-4 text-xs font-semibold uppercase tracking-wider text-midnight/50">{r.label}</td>
                {products.map((p, i) => (
                  <td key={p.id} className="border-b border-line/60 p-4 text-sm">
                    {r.render(p, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense>
      <CompareInner />
    </Suspense>
  );
}
