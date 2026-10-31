"use client";

import { useEffect, useRef, useState } from "react";
import { categoryArt, type Category } from "@/lib/data/categories";
import { cn } from "@/lib/utils";

/**
 * A category as a photo card: label and serif name on the category's own colour, its photo filling the lower part.
 * Callers wrap it in a link or button and set its size with `className`. Falls back to the emoji tile when the
 * category has no art or the photo can't load.
 */
export function CategoryCard({ category, className }: { category: Pick<Category, "id" | "name" | "emoji" | "tint">; className?: string }) {
  const art = categoryArt(category.id);
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  // A server-rendered <img> can fail before React attaches onError, so check once on mount.
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);
  const bg = art?.bg ?? category.tint;
  const fg = art?.fg ?? "#1C1A2B";
  return (
    <span className={cn("relative flex h-[240px] w-[200px] shrink-0 flex-col overflow-hidden rounded-xl", className)} style={{ background: bg, color: fg }}>
      <span className="block px-3 pt-3">
        {art && <span className="block text-[9px] font-bold uppercase tracking-[0.08em] opacity-80">{art.label}</span>}
        <span className="mt-0.5 block font-display text-[16px] font-medium leading-tight tracking-[-0.009em]">{category.name}</span>
      </span>
      <span className="relative mx-2 mb-2 mt-2.5 block min-h-0 flex-1 overflow-hidden rounded-lg">
        {art && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={img}
            src={art.image}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="grid h-full w-full place-items-center bg-white/25 text-5xl" aria-hidden>
            {category.emoji}
          </span>
        )}
      </span>
    </span>
  );
}
