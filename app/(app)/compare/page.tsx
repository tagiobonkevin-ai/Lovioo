"use client";

import { Star, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DealScoreRing } from "@/components/product/DealScore";
import { ProductImage } from "@/components/product/ProductImage";
import { RetailerBadge, RetailerStack } from "@/components/product/RetailerBadge";
import { categoryById } from "@/lib/data/categories";
import { productById } from "@/lib/data/products";
import { retailerById } from "@/lib/data/retailers";
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
        <h1 className="mt-3 text-[22px] font-medium">Nothing to compare yet</h1>
        <p className="mt-1 text-sm text-ink/60">Tap “Compare” on up to 3 products and they&apos;ll line up here side by side.</p>
        <Link href="/search" className="btn-primary mt-5">
          Browse products
        </Link>
      </div>
    );
  }

  const insights = products.map(getInsight);
  // "See prices" picks have no price or score, so they never win these.
  const priced = insights.map((ins, i) => ({ ins, i })).filter((x) => x.ins.priced);
  const bestIdx = priced.length ? priced.reduce((b, x) => (x.ins.dealScore > b.ins.dealScore ? x : b)).i : -1;
  const cheapestIdx = priced.length ? priced.reduce((b, x) => (x.ins.bestOffer.price < b.ins.bestOffer.price ? x : b)).i : -1;
  const seeStore = <span className="text-sm text-ink/50">See on store</span>;

  const rows: { label: string; render: (p: Product, i: number) => React.ReactNode }[] = [
    {
      label: "Best price",
      render: (p, i) =>
        insights[i].priced ? (
          <span className={cn("text-[18px] leading-[1.5]", i === cheapestIdx && "text-emerald-600")}>{peso(insights[i].bestOffer.price)}</span>
        ) : (
          <Link href={`/product/${p.slug}`} className="text-sm font-bold text-pink">
            See prices →
          </Link>
        ),
    },
    { label: "Best store", render: (p, i) => (insights[i].priced ? <RetailerBadge id={insights[i].bestOffer.retailer} withName /> : <RetailerStack ids={p.offers.map((o) => o.retailer)} />) },
    { label: "Deal score", render: (_, i) => (insights[i].priced ? <DealScoreRing score={insights[i].dealScore} size={48} /> : seeStore) },
    { label: "AI verdict", render: (_, i) => <span className="text-sm font-semibold">{insights[i].headline}</span> },
    { label: "90-day low", render: (_, i) => (insights[i].priced ? peso(insights[i].lowest90) : seeStore) },
    {
      label: "Rating",
      render: (p) =>
        p.reviewCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-sunset text-sunset" /> {p.rating} ({compact(p.reviewCount)})
          </span>
        ) : (
          seeStore
        ),
    },
    { label: "Category", render: (p) => `${categoryById(p.category).name} · ${p.subcategory}` },
    { label: "Stores", render: (p) => p.offers.map((o) => retailerById(o.retailer).name).join(", ") },
  ];

  const remove = (id: string) => {
    toggleCompare(id);
    router.replace(`/compare?ids=${ids.filter((x) => x !== id).join(",")}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-[30px] leading-[1.35]">Side-by-side compare</h1>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 overflow-hidden rounded-3xl bg-white shadow-soft">
          <thead>
            <tr>
              <th className="w-40 border-b border-ink/15 p-4" />
              {products.map((p, i) => (
                <th key={p.id} className="relative border-b border-ink/15 p-4 text-left align-top font-normal">
                  <button onClick={() => remove(p.id)} className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-ink/[0.03]" aria-label={`Remove ${p.name}`}>
                    <X className="h-4 w-4" />
                  </button>
                  {i === bestIdx && <span className="mb-2 inline-block rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold text-white">LOVIOO PICK</span>}
                  <ProductImage product={p} className="aspect-square w-28 rounded-2xl" emojiSize="text-5xl" />
                  <Link href={`/product/${p.slug}`} className="mt-2 line-clamp-2 block text-[13px] font-semibold leading-snug hover:text-pink">
                    {p.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="border-b border-line/60 p-4 text-xs font-semibold uppercase tracking-wider text-ink/50">{r.label}</td>
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
