"use client";

import { GitCompareArrows, Star } from "lucide-react";
import Link from "next/link";
import { useHydrated } from "@/components/Providers";
import { brandOf } from "@/lib/data/brands";
import { bestOffer, discountPct, isPriced } from "@/lib/data/products";
import { useLovioo } from "@/lib/store";
import type { Product } from "@/lib/types";
import { cn, compact, peso } from "@/lib/utils";
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

  // Lovioo's product card: the photo on a white card, the details on a light-pink panel with a round save button.
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-[1.75rem] bg-white p-2 shadow-[0_18px_40px_-30px_rgba(17,17,17,0.35)] ring-1 ring-ink/[0.06] transition hover:-translate-y-1 hover:shadow-[0_26px_50px_-26px_rgba(255,79,184,0.55)]",
        className,
      )}
    >
      <Link href={`/product/${product.slug}`} className="block overflow-hidden rounded-[1.4rem]">
        <ProductImage product={product} className="aspect-square transition duration-500 group-hover:scale-[1.04]" />
      </Link>
      <div className="pointer-events-none absolute left-4 top-4 flex gap-1.5">
        {product.isNew && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white">NEW</span>}
        {product.trending && <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-coral">🔥 Hot</span>}
        {pct > 0 && <span className="rounded-full bg-pink px-2 py-0.5 text-[10px] font-bold text-white">-{pct}%</span>}
      </div>
      {showCompare && (
        <button
          type="button"
          onClick={() => toggleCompare(product.id)}
          aria-pressed={inCompare}
          aria-label={inCompare ? "Remove from compare" : "Add to compare"}
          className={cn(
            "absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full shadow-sm backdrop-blur transition",
            inCompare ? "bg-pink text-white" : "bg-white/90 text-ink/60 hover:text-pink",
          )}
        >
          <GitCompareArrows className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="mt-2 flex flex-1 flex-col rounded-[1.4rem] bg-pink-soft p-3.5">
        {brand ? (
          <Link href={`/brand/${brand.id}`} className="inline-flex w-fit max-w-full items-center truncate text-[10px] font-bold uppercase tracking-[0.08em] text-pink hover:underline">
            {brand.name}
          </Link>
        ) : (
          <span className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-ink/45">{product.brand}</span>
        )}
        <Link href={`/product/${product.slug}`} className="mt-0.5 line-clamp-2 text-[14px] font-semibold leading-snug hover:text-pink">
          {product.name}
        </Link>
        {product.reviewCount > 0 && (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-ink/60">
            <Star className="h-3 w-3 fill-sunset text-sunset" />
            {product.rating} <span className="text-ink/40">({compact(product.reviewCount)})</span>
          </div>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            {isPriced(product) ? (
              <p className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-[17px] font-extrabold">{peso(best.price)}</span>
                {best.originalPrice > best.price && <span className="text-[11px] text-ink/40 line-through">{peso(best.originalPrice)}</span>}
              </p>
            ) : (
              <Link href={`/product/${product.slug}`} className="text-[13px] font-bold text-pink">
                See prices →
              </Link>
            )}
            <RetailerStack ids={product.offers.map((o) => o.retailer)} />
          </div>
          <HeartButton productId={product.id} size="lg" className="shrink-0 !bg-white shadow-[0_8px_20px_-8px_rgba(255,79,184,0.6)]" />
        </div>
      </div>
    </div>
  );
}
