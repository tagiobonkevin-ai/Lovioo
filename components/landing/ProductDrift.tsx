import { Lock } from "lucide-react";
import Link from "next/link";
import { ProductImage } from "@/components/product/ProductImage";
import type { Teaser } from "@/lib/data/teaser";
import { cn } from "@/lib/utils";

/** Splits the teaser into the two drifting rows. */
export function driftRows(items: Teaser[]) {
  const picks = items.slice(0, 20);
  return [picks.filter((_, i) => i % 2 === 0), picks.filter((_, i) => i % 2 === 1)];
}

/** A product photo and name with the price locked: prices are for members, so the card leads to Swipe (or sign-up). */
function DriftCard({ item }: { item: Teaser }) {
  return (
    <Link href="/swipe" className="group block w-40 shrink-0 sm:w-48" tabIndex={-1}>
      <ProductImage product={item} className="aspect-[4/5] rounded-2xl transition duration-500 group-hover:scale-[1.02]" emojiSize="text-5xl" />
      <p className="mt-2 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-midnight/45">{item.brand}</p>
      <p className="truncate text-[13px] text-midnight/80">{item.name}</p>
      <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-midnight/70 ring-1 ring-midnight/10 transition group-hover:text-pink group-hover:ring-pink/40">
        <Lock className="h-3 w-3" aria-hidden /> Sign up to see price
      </p>
    </Link>
  );
}

export function DriftRow({ items, reverse }: { items: Teaser[]; reverse?: boolean }) {
  if (!items.length) return null;
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className={cn("flex w-max gap-4 hover:[animation-play-state:paused] motion-reduce:animate-none", reverse ? "animate-drift-reverse" : "animate-drift")}>
        {[...items, ...items].map((t, i) => (
          <div key={`${t.name}-${i}`} aria-hidden={i >= items.length || undefined}>
            <DriftCard item={t} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Home page: an editorial landing built around describing what you want in your own words. */
