"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";
import { InsightCard } from "@/components/product/InsightCard";
import { OfferTable } from "@/components/product/OfferTable";
import { PriceHistoryChart } from "@/components/product/PriceHistoryChart";
import { ProductImage } from "@/components/product/ProductImage";
import { productBySlug } from "@/lib/data/products";
import { cn } from "@/lib/utils";

const TABS = ["All offers", "Price history", "Product info"] as const;

export default function CompareOffers({ params }: { params: { slug: string } }) {
  const product = productBySlug(params.slug);
  const [tab, setTab] = useState<(typeof TABS)[number]>("All offers");
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Compare offers</h1>
          <p className="text-midnight/60">{product.name}</p>
        </div>
        <Link href={`/product/${product.slug}`} className="flex items-center gap-3 rounded-2xl bg-white p-2 pr-4 shadow-soft">
          <ProductImage product={product} className="h-12 w-12 rounded-xl" emojiSize="text-2xl" />
          <span className="text-sm font-semibold">View product details</span>
        </Link>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("chip", tab === t && "chip-active")}>
            {t}
            {t === "All offers" && ` (${product.offers.length})`}
          </button>
        ))}
      </div>

      {tab === "All offers" && <OfferTable product={product} />}
      {tab === "Price history" && (
        <div className="card p-5">
          <PriceHistoryChart product={product} />
        </div>
      )}
      {tab === "Product info" && (
        <div className="card space-y-4 p-6">
          <p className="text-sm leading-relaxed text-midnight/70">{product.description}</p>
          <ul className="list-inside list-disc text-sm text-midnight/70">
            {product.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      <InsightCard product={product} />

      <div className="flex items-start gap-3 rounded-2xl bg-signal/10 p-4 text-sm text-midnight/70">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
        Prices and availability are provided by the respective retailers and may change at any time. Please check the retailer&apos;s website for the latest information.
      </div>
    </div>
  );
}
