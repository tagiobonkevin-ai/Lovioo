"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowUpRight, ExternalLink, Star, Truck } from "lucide-react";
import Link from "next/link";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { DealScoreRing, DiscountBadge, scoreColor } from "@/components/product/DealScore";
import { ProductImage } from "@/components/product/ProductImage";
import { RetailerBadge, RetailerStack } from "@/components/product/RetailerBadge";
import { discountPct } from "@/lib/data/products";
import { offerHref, retailerById } from "@/lib/data/retailers";
import { getInsight } from "@/lib/insights";
import type { SwipeAction } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/sync";
import type { Product } from "@/lib/types";
import { cn, compact, peso } from "@/lib/utils";

export interface SwipeCardHandle {
  fly: (dir: SwipeAction) => void;
}

interface Props {
  product: Product;
  depth: number;
  flipped: boolean;
  onFlip: () => void;
  onSwiped: (dir: SwipeAction) => void;
}

const THRESHOLD = 110;

export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard({ product, depth, flipped, onFlip, onSwiped }, ref) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-320, 320], [-16, 16]);
  const loveOpacity = useTransform(x, [25, THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-THRESHOLD, -25], [1, 0]);
  const superOpacity = useTransform(y, [-THRESHOLD - 20, -30], [1, 0]);
  const active = depth === 0;
  const insight = getInsight(product);
  const pct = discountPct(product);
  const tone = insight.priced ? scoreColor(insight.dealScore) : "#A855F7";

  const flown = useRef(false);
  const fly = (dir: SwipeAction) => {
    if (flown.current) return;
    flown.current = true;
    const target = dir === "love" ? { x: 700, y: y.get() + 40 } : dir === "nope" ? { x: -700, y: y.get() + 40 } : { x: x.get(), y: -900 };
    animate(x, target.x, { duration: 0.35, ease: "easeIn" });
    animate(y, target.y, { duration: 0.35, ease: "easeIn" });
    // A timer rather than the animation promise: an interrupted animation never resolves.
    window.setTimeout(() => onSwiped(dir), 340);
  };
  useImperativeHandle(ref, () => ({ fly }));

  return (
    // Outer layer: position in the stack. Inner layer: drag / fly-out, so the two never animate the same value.
    <motion.div
      className="absolute inset-0"
      style={{ zIndex: 10 - depth }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.05, y: depth * 14, opacity: depth > 2 ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ x, y, rotate, touchAction: "none" }}
        drag={active}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          const dx = x.get();
          const dy = y.get();
          if (dy < -THRESHOLD && Math.abs(dx) < THRESHOLD) fly("super");
          else if (dx > THRESHOLD || info.velocity.x > 700) fly("love");
          else if (dx < -THRESHOLD || info.velocity.x < -700) fly("nope");
          else {
            animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
            animate(y, 0, { type: "spring", stiffness: 400, damping: 30 });
          }
        }}
        onTap={() => active && onFlip()}
      >
        <motion.div
          className="relative h-full w-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped && active ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          {/* Front */}
          <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-black/5" style={{ backfaceVisibility: "hidden" }}>
            <ProductImage product={product} className="h-full w-full" emojiSize="text-[9rem]" />
            <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-midnight/90 via-midnight/40 to-transparent" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
              {product.trending && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-coral">🔥 Trending</span>}
              {product.isNew && <span className="rounded-full bg-midnight/80 px-2.5 py-1 text-[11px] font-semibold text-white">NEW</span>}
            </div>
            {insight.priced && (
              <div className="absolute right-4 top-4 rounded-full bg-white/90 p-1 shadow">
                <DealScoreRing score={insight.dealScore} size={50} />
              </div>
            )}

            {/* Stamps */}
            <motion.div style={{ opacity: loveOpacity }} className="pointer-events-none absolute left-6 top-16 -rotate-12 rounded-2xl border-4 border-emerald-400 px-4 py-1 text-4xl font-extrabold tracking-wider text-emerald-400">
              LOVE 💚
            </motion.div>
            <motion.div style={{ opacity: nopeOpacity }} className="pointer-events-none absolute right-6 top-16 rotate-12 rounded-2xl border-4 border-coral px-4 py-1 text-4xl font-extrabold tracking-wider text-coral">
              NOPE
            </motion.div>
            <motion.div style={{ opacity: superOpacity }} className="pointer-events-none absolute inset-x-0 top-1/3 mx-auto w-max rounded-2xl border-4 border-grape bg-white/20 px-4 py-1 text-3xl font-extrabold tracking-wider text-grape backdrop-blur">
              SUPER LOVE ⭐
            </motion.div>

            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">{product.brand}</p>
              <h3 className="mt-0.5 text-2xl font-bold leading-tight">{product.name}</h3>
              {insight.priced ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-2xl font-extrabold">{peso(insight.bestOffer.price)}</span>
                  {pct > 0 && <span className="text-sm text-white/60 line-through">{peso(insight.bestOffer.originalPrice)}</span>}
                  <DiscountBadge pct={pct} />
                </div>
              ) : (
                <p className="mt-2 text-2xl font-extrabold">See prices</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/80">
                {insight.priced ? (
                  <span className="inline-flex items-center gap-1.5">
                    <RetailerBadge id={insight.bestOffer.retailer} size="xs" /> Best on {retailerById(insight.bestOffer.retailer).name}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <RetailerStack ids={product.offers.map((o) => o.retailer)} /> {insight.headline}
                  </span>
                )}
                {product.reviewCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-sunset text-sunset" /> {product.rating} ({compact(product.reviewCount)})
                  </span>
                )}
              </div>
              <p className="mt-3 text-[11px] text-white/60">{insight.priced ? `Tap to see all ${product.offers.length} offers ↻` : "Tap to see where to buy ↻"}</p>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col overflow-hidden rounded-[2rem] bg-white p-5 shadow-2xl ring-1 ring-black/5"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="flex items-start gap-3">
              <ProductImage product={product} className="h-16 w-16 shrink-0 rounded-2xl" emojiSize="text-3xl" />
              <div className="min-w-0">
                <p className="text-xs text-midnight/50">{product.brand}</p>
                <p className="line-clamp-2 font-bold leading-snug">{product.name}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl p-3.5" style={{ background: `${tone}14` }}>
              <p className="text-sm font-bold" style={{ color: tone }}>
                ✨ {insight.headline}
              </p>
              <p className="mt-1 text-xs text-midnight/70">{insight.reason}</p>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-midnight/50">{insight.priced ? "Compare offers" : "Where to buy"}</p>
            {!insight.priced && (
              <ul className="mt-2 flex-1 space-y-2 overflow-y-auto">
                {product.offers.map((o) => (
                  <li key={o.retailer}>
                    <a
                      href={offerHref(o.retailer, o.url, product.name).href}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      onPointerDownCapture={(e) => e.stopPropagation()}
                      onClick={() => trackEvent(getSupabase(), product.id, "click_out", o.retailer)}
                      className="flex items-center justify-between rounded-2xl border border-line px-3 py-2.5 hover:border-pink"
                    >
                      <RetailerBadge id={o.retailer} withName size="sm" />
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-pink">
                        Live prices <ExternalLink className="h-3 w-3" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {insight.priced && (
              <ul className="mt-2 flex-1 space-y-2 overflow-y-auto">
                {[...product.offers]
                  .sort((a, b) => a.price + a.shipping - (b.price + b.shipping))
                  .map((o, i) => (
                    <li key={o.retailer} className={cn("flex items-center justify-between rounded-2xl border px-3 py-2.5", i === 0 ? "border-emerald-300 bg-emerald-50/60" : "border-line")}>
                      <RetailerBadge id={o.retailer} withName size="sm" />
                      <span className="text-right">
                        <span className="block text-sm font-bold">{peso(o.price)}</span>
                        <span className="flex items-center justify-end gap-1 text-[10px] text-midnight/50">
                          <Truck className="h-3 w-3" /> {o.shipping ? peso(o.shipping) : "Free"} {!o.inStock && "· Sold out"}
                        </span>
                      </span>
                    </li>
                  ))}
              </ul>
            )}
            <Link
              href={`/product/${product.slug}`}
              onPointerDownCapture={(e) => e.stopPropagation()}
              className="btn-dark mt-3 w-full"
            >
              View details <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});
