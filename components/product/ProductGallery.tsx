"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductImage } from "./ProductImage";

/**
 * The product page's photo slides: the cover first, then the extra photos an admin added.
 * Swipe on a phone, arrows or thumbnails anywhere. With only one photo it's a plain picture.
 */
export function ProductGallery({ product, badge }: { product: Product; badge?: React.ReactNode }) {
  const photos = [product.image, ...(product.images ?? [])].map((p) => (p ?? "").trim()).filter(Boolean);
  const slides = photos.length ? photos : [""];
  const [at, setAt] = useState(0);
  const strip = useRef<HTMLDivElement>(null);

  // Keep the dot and thumbnails in step with a finger swipe.
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const onScroll = () => setAt(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const go = (i: number) => {
    const next = Math.max(0, Math.min(slides.length - 1, i));
    setAt(next);
    strip.current?.scrollTo({ left: next * (strip.current.clientWidth || 0), behavior: "smooth" });
  };

  return (
    // min-w-0: without it the grid column grows to fit the slide strip instead of the strip scrolling.
    <div className="w-full min-w-0 space-y-3">
      <div className="relative">
        <div ref={strip} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-[1.75rem]" aria-roledescription="carousel" aria-label={`${product.name} photos`}>
          {slides.map((src, i) => (
            <div key={i} className="w-full shrink-0 snap-center" aria-label={`Photo ${i + 1} of ${slides.length}`} role="group">
              <ProductImage product={{ ...product, image: src }} className="aspect-square" emojiSize="text-[10rem]" />
            </div>
          ))}
        </div>
        {badge}
        {slides.length > 1 && (
          <>
            <Arrow side="left" onClick={() => go(at - 1)} disabled={at === 0} />
            <Arrow side="right" onClick={() => go(at + 1)} disabled={at === slides.length - 1} />
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-ink/55 px-2 py-1 backdrop-blur">
              {slides.map((_, i) => (
                <span key={i} className={cn("h-1.5 rounded-full transition-all", i === at ? "w-4 bg-white" : "w-1.5 bg-white/55")} />
              ))}
            </div>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto">
          {slides.map((src, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === at}
              className={cn("w-[21%] min-w-[64px] shrink-0 overflow-hidden rounded-xl ring-2 transition", i === at ? "ring-pink" : "opacity-70 ring-transparent hover:opacity-100")}
            >
              <ProductImage product={{ ...product, image: src }} className="aspect-square" emojiSize="text-3xl" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Arrow({ side, onClick, disabled }: { side: "left" | "right"; onClick: () => void; disabled: boolean }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={cn(
        "absolute top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-soft ring-1 ring-ink/10 transition hover:bg-white disabled:opacity-0 sm:grid",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
