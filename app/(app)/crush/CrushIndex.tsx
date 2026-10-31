"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductImage } from "@/components/product/ProductImage";
import { CRUSHES, crushProducts } from "@/lib/data/crush";

/** All Brand Crush collections, each previewed with up to three of its real products. */
export function CrushIndex() {
  const series = CRUSHES.filter((c) => c.series);
  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-pink">Brand Crush</p>
        <h1 className="mt-1 text-[36px] font-medium leading-[1.2] tracking-[-0.012em] sm:text-[48px]">Some Finds Just Hit Different.</h1>
        <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-ink/60">
          Meet your next favourite things. Discover products that catch your eye, make life easier, elevate your style or simply make you smile.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {series.map((c) => {
          const picks = crushProducts(c).slice(0, 3);
          return (
            <Link key={c.slug} href={`/crush/${c.slug}`} className="group flex flex-col rounded-3xl bg-pink-soft p-4 transition hover:shadow-pop">
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((i) =>
                  picks[i] ? (
                    <ProductImage key={i} product={picks[i]} className="aspect-square rounded-2xl" emojiSize="text-3xl" />
                  ) : (
                    <span key={i} className="grid aspect-square place-items-center rounded-2xl bg-white/70 text-2xl" aria-hidden>
                      {i === 0 ? c.emoji : ""}
                    </span>
                  ),
                )}
              </div>
              <p className="mt-4 font-display text-[20px] font-medium">
                <span aria-hidden>{c.emoji}</span> {c.title}
              </p>
              <p className="mt-0.5 flex-1 text-[13px] leading-snug text-ink/60">{c.tagline}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-pink">
                Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
