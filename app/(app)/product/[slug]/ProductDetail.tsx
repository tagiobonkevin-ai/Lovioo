"use client";

import { Bell, BellRing, Check, GitCompareArrows, Heart, Share2, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { DiscountBadge } from "@/components/product/DealScore";
import { InsightCard } from "@/components/product/InsightCard";
import { OfferTable } from "@/components/product/OfferTable";
import { PriceHistoryChart } from "@/components/product/PriceHistoryChart";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductImage } from "@/components/product/ProductImage";
import { toast, useHydrated } from "@/components/Providers";
import { brandOf } from "@/lib/data/brands";
import { categoryById } from "@/lib/data/categories";
import { bestOffer, discountPct, isPriced, productBySlug } from "@/lib/data/products";
import { offerHref, retailerById } from "@/lib/data/retailers";
import { getInsight } from "@/lib/insights";
import { similarProducts } from "@/lib/recommend";
import { useLovioo } from "@/lib/store";
import type { Product } from "@/lib/types";
import { getSupabase } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/sync";
import { cn, compact, peso } from "@/lib/utils";

const TABS = ["Compare offers", "Price history", "Details"] as const;

/** Products load in the browser for members (members-only catalog), so an unknown slug is detected here. */
export function ProductDetail({ slug }: { slug: string }) {
  const product = productBySlug(slug);
  if (!product) notFound();
  return <ProductView product={product} />;
}

function ProductView({ product }: { product: Product }) {
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
  const priced = isPriced(product);
  const tabs = priced ? TABS : TABS.filter((t) => t !== "Price history");

  useEffect(() => trackEvent(getSupabase(), product.id, "view"), [product.id]);

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
    <div className="space-y-10 pb-16 lg:pb-0">
      <nav className="text-xs text-ink/50">
        <Link href="/discover" className="hover:text-pink">Home</Link> <span className="mx-1.5">›</span>
        <Link href={`/search?category=${cat.id}`} className="hover:text-pink">{cat.name}</Link> <span className="mx-1.5">›</span>
        <span className="text-ink/70">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery
          product={product}
          badge={
            product.trending ? (
              <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-coral">🔥 Trending</span>
            ) : null
          }
        />

        <div>
          {brandOf(product) ? (
            <Link href={`/brand/${brandOf(product)!.id}`} className="text-sm font-semibold text-pink hover:underline">
              {product.brand} · see all {product.brand} products →
            </Link>
          ) : (
            <p className="text-sm font-medium text-ink/50">{product.brand}</p>
          )}
          <h1 className="mt-1 text-[30px] leading-[1.35]">{product.name}</h1>
          {product.reviewCount > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating) ? "fill-sunset text-sunset" : "text-line")} />
                ))}
              </span>
              <span className="font-semibold">{product.rating}</span>
              <span className="text-ink/50">({compact(product.reviewCount)} reviews)</span>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.tags.map((t) => (
              <span key={t} className="rounded-full bg-lavender px-2.5 py-1 text-[11px] font-medium capitalize text-ink/70">
                {t}
              </span>
            ))}
          </div>

          {priced ? (
            <>
              <div className="mt-6 flex items-end gap-3">
                <span className="text-4xl font-extrabold">{peso(best.price)}</span>
                {best.originalPrice > best.price && <span className="pb-1 text-ink/40 line-through">{peso(best.originalPrice)}</span>}
                <DiscountBadge pct={pct} className="mb-1.5" />
              </div>
              <p className="mt-1 text-sm text-ink/60">
                Lowest price on <b>{retailerById(best.retailer).name}</b> · compared across {product.offers.length} stores
              </p>
            </>
          ) : (
            <>
              <p className="mt-6 text-[30px] leading-[1.35]">See prices</p>
              <p className="mt-1 text-sm text-ink/60">
                {insight.headline} — compare sellers in <button onClick={() => setTab("Compare offers")} className="font-semibold text-pink">Where to buy</button> below.
              </p>
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (toggleSave(product.id)) toast({ title: "Saved!", body: "Added to your collection." });
              }}
              className={cn("btn !px-5", saved ? "bg-pink text-white shadow-pop" : "btn-ghost")}
            >
              <Heart className={cn("h-4 w-4", saved && "fill-white")} /> {saved ? "Saved" : "Save"}
            </button>
            {priced && (
              <button
                onClick={() => {
                  if (hasAlert) removeAlert(product.id);
                  else {
                    setAlert(product.id);
                    // Nothing emails yet, so promise only what Saved actually shows.
                    toast({ title: "Price alert on 🔔", body: `Watching for under ${peso(insight.lowest90)} — see it in Saved.`, kind: "ok" });
                  }
                }}
                className={cn("btn !px-5", hasAlert ? "bg-grape text-white" : "btn-ghost")}
              >
                {hasAlert ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />} {hasAlert ? "Alert on" : "Price alert"}
              </button>
            )}
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
          <p className="mt-5 text-sm leading-relaxed text-ink/70">{product.description}</p>
        </div>
      </div>

      <section id="offers" className="card scroll-mt-20 p-5 sm:p-6">
        <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-ink/15">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("-mb-px shrink-0 border-b-2 pb-3 text-sm font-semibold transition", tab === t ? "border-pink text-pink" : "border-transparent text-ink/50")}>
              {t === "Compare offers" && !priced ? "Where to buy" : t}
            </button>
          ))}
        </div>
        <div className="mt-5">
          {tab === "Compare offers" && (
            <>
              <OfferTable product={product} />
              <p className="mt-3 text-xs text-ink/50">
                {priced && lastChecked(product.offers)}Prices and availability are set by each retailer and may change — check the store before you buy.
              </p>
            </>
          )}
          {tab === "Price history" && priced && <PriceHistoryChart product={product} />}
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
              <li className="text-sm text-ink/60">Category: {cat.name} › {product.subcategory}</li>
            </ul>
          )}
        </div>
      </section>

      <StickyBuyBar product={product} priced={priced} onCompare={() => setTab("Compare offers")} />

      <section>
        <h2 className="text-[20px] leading-[1.5]">You might also love</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {similarProducts(product).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

function lastChecked(offers: { updatedAt?: string }[]) {
  const times = offers.map((o) => (o.updatedAt ? Date.parse(o.updatedAt) : NaN)).filter((t) => !Number.isNaN(t));
  if (!times.length) return "";
  const d = new Date(Math.max(...times));
  return `Prices last checked ${d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })}. `;
}

/** Phone-only bar above the tab bar: the best price and a one-tap way to the store. */
function StickyBuyBar({ product, priced, onCompare }: { product: ReturnType<typeof productBySlug> & {}; priced: boolean; onCompare: () => void }) {
  const best = bestOffer(product);
  const link = offerHref(best.retailer, best.url, product.name);
  return (
    <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 rounded-2xl bg-midnight/95 p-2.5 pl-4 text-white shadow-soft backdrop-blur lg:hidden">
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] text-white/60">{priced ? `Best price on ${retailerById(best.retailer).name}` : `${product.offers.length} stores`}</span>
        <span className="block truncate text-base font-extrabold">{priced ? peso(best.price) : "See live prices"}</span>
      </span>
      {priced ? (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => trackEvent(getSupabase(), product.id, "click_out", best.retailer)}
          className="btn-gradient !px-4 !py-2.5"
        >
          Shop now
        </a>
      ) : (
        <button
          onClick={() => {
            onCompare();
            document.getElementById("offers")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="btn-gradient !px-4 !py-2.5"
        >
          Where to buy
        </button>
      )}
    </div>
  );
}
