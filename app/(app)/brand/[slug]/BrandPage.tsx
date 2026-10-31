"use client";

import { ArrowLeft, BadgeCheck, ExternalLink, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BrandAvatar } from "@/components/brand/BrandAvatar";
import { AffiliateNote } from "@/components/legal/AffiliateNote";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { brandById, brandProducts } from "@/lib/data/brands";
import { bestOffer, isPriced, lowestPrice } from "@/lib/data/products";
import { retailerById } from "@/lib/data/retailers";
import type { Product } from "@/lib/types";
import { cn, peso } from "@/lib/utils";

const SORTS = {
  popular: { label: "Popular", fn: (a: Product, b: Product) => Number(!!b.trending) - Number(!!a.trending) || b.reviewCount - a.reviewCount },
  low: { label: "Price: low to high", fn: (a: Product, b: Product) => Number(isPriced(b)) - Number(isPriced(a)) || lowestPrice(a) - lowestPrice(b) },
  high: { label: "Price: high to low", fn: (a: Product, b: Product) => Number(isPriced(b)) - Number(isPriced(a)) || lowestPrice(b) - lowestPrice(a) },
} as const;

export function BrandPage({ slug }: { slug: string }) {
  const brand = brandById(slug)!;
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<keyof typeof SORTS>("popular");
  const products = useMemo(() => [...brandProducts(brand)].sort(SORTS[sort].fn), [brand, sort]);
  const priced = products.filter(isPriced);
  const from = priced.length ? Math.min(...priced.map(lowestPrice)) : null;
  const storeHref = brand.storeUrl ?? (brand.retailer ? retailerById(brand.retailer).affiliateUrl ?? retailerById(brand.retailer).homepage : undefined);

  return (
    <div className="space-y-6">
      <Link href="/brands" className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-pink">
        <ArrowLeft className="h-4 w-4" /> All brands
      </Link>

      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={{ background: brand.cover ? undefined : `linear-gradient(140deg, ${brand.color} 0%, ${brand.color}bb 50%, #0F2742 150%)` }}
      >
        {brand.cover && <img src={brand.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <span className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-midnight/30 to-transparent" />
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/20 blur-2xl" />
        <div className="relative flex flex-wrap items-end gap-4">
          <BrandAvatar brand={brand} className="h-20 w-20 text-2xl ring-4 ring-white/70" />
          <div className="min-w-0 flex-1">
            {brand.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-pink">
                <BadgeCheck className="h-3.5 w-3.5" /> Featured brand
              </span>
            )}
            <h1 className="mt-1 text-[30px] leading-[1.35]">{brand.name}</h1>
            <p className="text-sm text-white/85">
              {brand.tagline || `${products.length} product${products.length === 1 ? "" : "s"} on Lovioo`}
              {from !== null && ` · from ${peso(from)}`}
            </p>
          </div>
          {storeHref && (
            <a href={storeHref} target="_blank" rel="noopener noreferrer sponsored" className="btn bg-white text-ink shadow-pop">
              Visit {brand.retailer ? `${brand.name} on ${retailerById(brand.retailer).name}` : "official store"} <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {storeHref && <AffiliateNote compact light className="basis-full text-right" />}
        </div>
        {brand.description && <p className="relative mt-4 max-w-2xl text-sm text-white/85">{brand.description}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full bg-white p-1 ring-1 ring-line" role="radiogroup" aria-label="View">
          {(
            [
              ["grid", "Grid", LayoutGrid],
              ["list", "Price list", List],
            ] as const
          ).map(([v, label, Icon]) => (
            <button
              key={v}
              role="radio"
              aria-checked={view === v}
              onClick={() => setView(v)}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition", view === v ? "bg-pink text-white" : "text-ink/60")}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)} className="ml-auto rounded-full border border-ink/15 bg-white px-3 py-2 text-xs font-medium" aria-label="Sort">
          {Object.entries(SORTS).map(([k, s]) => (
            <option key={k} value={k}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {products.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink/60">No products from {brand.name} yet — check back soon.</div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <PriceList products={products} />
      )}
    </div>
  );
}

function PriceList({ products }: { products: Product[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink/15 bg-white">
      <div className="hidden grid-cols-[1fr_120px_140px] gap-4 border-b border-ink/15 bg-blush/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink/50 sm:grid">
        <span>Product</span>
        <span className="text-right">Best price</span>
        <span className="text-right">Store</span>
      </div>
      <ul className="divide-y divide-ink/10/70">
        {products.map((p) => {
          const best = bestOffer(p);
          return (
            <li key={p.id}>
              <Link href={`/product/${p.slug}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition hover:bg-ink/[0.03]/70 sm:grid-cols-[1fr_120px_140px] sm:px-5">
                <span className="flex min-w-0 items-center gap-3">
                  <ProductImage product={p} className="h-12 w-12 shrink-0 rounded-xl" emojiSize="text-2xl" />
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</span>
                    <span className="text-xs text-ink/50">{p.subcategory}</span>
                  </span>
                </span>
                <span className="text-right text-sm font-extrabold">{isPriced(p) ? peso(best.price) : <span className="text-pink">See prices</span>}</span>
                <span className="col-span-2 flex items-center justify-end gap-1.5 text-xs text-ink/60 sm:col-span-1">
                  <RetailerBadge id={best.retailer} size="xs" /> {isPriced(p) ? retailerById(best.retailer).name : `${p.offers.length} stores`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
