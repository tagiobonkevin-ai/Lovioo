"use client";

import { useEffect, useRef, useState } from "react";
import { categoryArt, type Category } from "@/lib/data/categories";
import { cn } from "@/lib/utils";

/**
 * A category as a photo card in the brand style: light pink card, pink label, dark bold name, and the HD photo inset
 * with rounded corners. Callers wrap it in a link or button and set its size with `className`. Falls back to the
 * emoji when the category has no photo or the photo can't load.
 */
export function CategoryCard({ category, className, tagline = false }: { category: Pick<Category, "id" | "name" | "emoji">; className?: string; tagline?: boolean }) {
  const art = categoryArt(category.id);
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  // A server-rendered <img> can fail before React attaches onError, so check once on mount.
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);
  return (
    <span className={cn("relative flex h-[240px] w-[200px] shrink-0 flex-col overflow-hidden rounded-3xl bg-pink-soft text-ink ring-1 ring-pink/10", className)}>
      <span className="block px-3.5 pt-3.5">
        {art && <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-pink">{art.label}</span>}
        <span className="mt-0.5 block font-display text-[16px] font-medium leading-tight">{category.name}</span>
        {tagline && art && <span className="mt-0.5 block text-[12px] leading-snug text-ink/55">{art.tagline}</span>}
      </span>
      <span className="relative mx-2 mb-2 mt-2.5 block min-h-0 flex-1 overflow-hidden rounded-2xl bg-white">
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
          <span className="grid h-full w-full place-items-center text-5xl" aria-hidden>
            {category.emoji}
          </span>
        )}
      </span>
    </span>
  );
}
