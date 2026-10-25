"use client";

import { Bell, BellRing, Check, GitCompareArrows, Heart, Share2, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DiscountBadge } from "@/components/product/DealScore";
import { InsightCard } from "@/components/product/InsightCard";
import { OfferTable } from "@/components/product/OfferTable";
import { PriceHistoryChart } from "@/components/product/PriceHistoryChart";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { toast, useHydrated } from "@/components/Providers";
import { categoryById } from "@/lib/data/categories";
import { bestOffer, discountPct, productBySlug } from "@/lib/data/products";
import { RETAILERS } from "@/lib/data/retailers";
import { getInsight } from "@/lib/insights";
import { similarProducts } from "@/lib/recommend";
import { useLovioo } from "@/lib/store";
import { cn, compact, peso } from "@/lib/utils";

const TABS = ["Compare offers", "Price history", "Details"] as const;

export function ProductDetail({ slug }: { slug: string }) {
  const product = productBySlug(slug)!;
  const hydrated = useHydrated();
  const saved = useLovioo((s) => s.saved.includes(product.id)) && hydrated;
  const alert = useLovioo((s) => s.alerts.find((a) => a.productId === product.id));
  const { toggleSave, setAlert, removeAlert } = useLovioo();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Compare offers");
  const best = bestOffer(product);
  const insight = getInsight(product);
  const pct = discountPct(product);
  const cat = categoryById(product.category);
  const hasAlert = hydrated && !!alert;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", kind: "ok" });
      }
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <div className="space-y-10">
      <nav className="text-xs text-midnight/50">
        <Link href="/discover" className="hover:text-pink">Home</Link> <span className="mx-1.5">›</span>
        <Link href={`/search?category=${cat.id}`} className="hover:text-pink">{cat.name}</Link> <span className="mx-1.5">›</span>
        <span className="text-midnight/70">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative">
            <ProductImage product={product} className="aspect-square rounded-[2rem] shadow-soft" emojiSize="text-[10rem]" />
            {product.trending && <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-coral">🔥 Trending</span>}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={cn("overflow-hidden rounded-2xl ring-2", i === 0 ? "ring-pink" : "ring-transparent opacity-70")}>
                <ProductImage product={product} className="aspect-square" emojiSize="text-3xl" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-midnight/50">{product.brand}</p>
          <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating) ? "fill-sunset text-sunset" : "text-line")} />
              ))}
            </span>
            <span className="font-semibold">{product.rating}</span>
            <span className="text-midnight/50">({compact(product.reviewCount)} reviews)</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.tags.map((t) => (
              <span key={t} className="rounded-full bg-lavender px-2.5 py-1 text-[11px] font-medium capitalize text-midnight/70">
                {t}
              </span>
            ))}
          </div>

          <div className="mt-6 flex items-end gap-3">
            <span className="text-4xl font-extrabold">{peso(best.price)}</span>
            {best.originalPrice > best.price && <span className="pb-1 text-midnight/40 line-through">{peso(best.originalPrice)}</span>}
            <DiscountBadge pct={pct} className="mb-1.5" />
          </div>
          <p className="mt-1 text-sm text-midnight/60">
            Lowest price on <b>{RETAILERS[best.retailer].name}</b> · compared across {product.offers.length} stores
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (toggleSave(product.id)) toast({ title: "Saved!", body: "Added to your collection." });
              }}
              className={cn("btn !px-5", saved ? "bg-pink text-white shadow-pop" : "btn-ghost")}
            >
              <Heart className={cn("h-4 w-4", saved && "fill-white")} /> {saved ? "Saved" : "Save"}
            </button>
            <button
              onClick={() => {
                if (hasAlert) removeAlert(product.id);
                else {
                  setAlert(product.id);
                  toast({ title: "Price alert on 🔔", body: `We'll ping you under ${peso(insight.lowest90)}.`, kind: "ok" });
                }
              }}
              className={cn("btn !px-5", hasAlert ? "bg-grape text-white" : "btn-ghost")}
            >
              {hasAlert ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />} {hasAlert ? "Alert on" : "Price alert"}
            </button>
            <Link href={`/compare/${product.slug}`} className="btn-ghost !px-5">
              <GitCompareArrows className="h-4 w-4" /> Compare
            </Link>
            <button onClick={share} className="btn-ghost !px-4" aria-label="Share">
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6">
            <InsightCard product={product} />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-midnight/70">{product.description}</p>
        </div>
      </div>

      <section className="card p-5 sm:p-6">
        <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-line">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("-mb-px shrink-0 border-b-2 pb-3 text-sm font-semibold transition", tab === t ? "border-pink text-pink" : "border-transparent text-midnight/50")}>
              {t}
            </button>
          ))}
        </div>
        <div className="mt-5">
          {tab === "Compare offers" && (
            <>
              <OfferTable product={product} />
              <p className="mt-3 text-xs text-midnight/50">Last checked today. Prices and availability are provided by the retailers and may change.</p>
            </>
          )}
          {tab === "Price history" && <PriceHistoryChart product={product} />}
          {tab === "Details" && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {product.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-pink/10 text-pink">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {h}
                </li>
              ))}
              <li className="text-sm text-midnight/60">Category: {cat.name} › {product.subcategory}</li>
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-extrabold">You might also love</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {similarProducts(product).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
