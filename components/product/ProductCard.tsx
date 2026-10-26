"use client";

import { GitCompareArrows, Star } from "lucide-react";
import Link from "next/link";
import { useHydrated } from "@/components/Providers";
import { brandOf } from "@/lib/data/brands";
import { bestOffer, discountPct, isPriced } from "@/lib/data/products";
import { useLovioo } from "@/lib/store";
import type { Product } from "@/lib/types";
import { cn, compact, peso } from "@/lib/utils";
import { DiscountBadge } from "./DealScore";
import { HeartButton } from "./HeartButton";
import { ProductImage } from "./ProductImage";
import { RetailerStack } from "./RetailerBadge";

export function ProductCard({ product, showCompare = true, className }: { product: Product; showCompare?: boolean; className?: string }) {
  const best = bestOffer(product);
  const pct = discountPct(product);
  const hydrated = useHydrated();
  const inCompare = useLovioo((s) => s.compare.includes(product.id)) && hydrated;
  const toggleCompare = useLovioo((s) => s.toggleCompare);
  const brand = brandOf(product);

  return (
    <div className={cn("group relative flex flex-col overflow-hidden rounded-3xl border border-line/70 bg-white transition hover:-translate-y-1 hover:shadow-soft", className)}>
      <Link href={`/product/${product.slug}`} className="block">
        <ProductImage product={product} className="aspect-square transition duration-500 group-hover:scale-[1.03]" />
      </Link>
      <div className="absolute left-3 top-3 flex gap-1.5">
        {product.isNew && <span className="rounded-full bg-midnight px-2 py-0.5 text-[10px] font-semibold text-white">NEW</span>}
        {product.trending && <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-coral">🔥 Hot</span>}
      </div>
      <HeartButton productId={product.id} className="absolute right-3 top-3" />

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        {brand ? (
          <Link href={`/brand/${brand.id}`} className="inline-flex w-fit min-h-[24px] max-w-full items-center truncate text-[11px] font-bold uppercase tracking-wide text-pink/90 hover:text-pink">
            {brand.name}
          </Link>
        ) : (
          <span className="truncate text-[11px] font-bold uppercase tracking-wide text-midnight/40">{product.brand}</span>
        )}
        <Link href={`/product/${product.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug hover:text-pink">
          {product.name}
        </Link>
        <span className="text-xs text-midnight/50">{product.subcategory}</span>
        {product.reviewCount > 0 && (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-midnight/60">
            <Star className="h-3 w-3 fill-sunset text-sunset" />
            {product.rating} <span className="text-midnight/40">({compact(product.reviewCount)})</span>
          </div>
        )}
        <div className="mt-1 flex items-center gap-2">
          {isPriced(product) ? (
            <>
              <span className="text-base font-bold">{peso(best.price)}</span>
              <DiscountBadge pct={pct} />
            </>
          ) : (
            <Link href={`/product/${product.slug}`} className="text-sm font-bold text-pink">
              See prices →
            </Link>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <RetailerStack ids={product.offers.map((o) => o.retailer)} />
          {showCompare && (
            <button
              type="button"
              onClick={() => toggleCompare(product.id)}
              className={cn(
                "inline-flex min-h-[32px] items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
                inCompare ? "bg-pink text-white" : "bg-pink/10 text-pink hover:bg-pink/15",
              )}
            >
              <GitCompareArrows className="h-3 w-3" />
              {inCompare ? "Added" : "Compare"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
