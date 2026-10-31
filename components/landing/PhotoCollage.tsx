import Link from "next/link";
import { cn } from "@/lib/utils";

export interface CollageItem {
  href: string;
  image: string;
  label: string;
}

const TILTS = ["-rotate-[7deg] left-[2%] top-[12%] z-10", "rotate-[2deg] left-[30%] top-[2%] z-20", "rotate-[8deg] right-[2%] top-[16%] z-10"];
const STICKERS = ["left-[4%] bottom-[6%] -rotate-6", "right-[6%] bottom-[4%] rotate-6"];

/**
 * A social-style collage: up to three real product photos as tilted white-framed prints on a pink blob, with two
 * sticker labels. Every print links to its product.
 */
export function PhotoCollage({ items, stickers, className }: { items: CollageItem[]; stickers: string[]; className?: string }) {
  if (!items.length) return null;
  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-[460px]", className)}>
      <div className="absolute inset-[6%] rounded-[42%_58%_55%_45%/50%_42%_58%_50%] bg-gradient-to-br from-pink/80 to-coral/70" aria-hidden />
      <div className="absolute inset-[16%] rounded-[55%_45%_48%_52%/45%_55%_45%_55%] bg-white/50" aria-hidden />
      {items.slice(0, 3).map((it, i) => (
        <Link
          key={it.href + i}
          href={it.href}
          aria-label={it.label}
          className={cn(
            "absolute block w-[42%] bg-white p-2 pb-7 shadow-[0_20px_40px_-18px_rgba(17,17,17,0.45)] transition hover:z-30 hover:scale-105",
            TILTS[i],
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.image} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover" />
          <span className="absolute inset-x-2 bottom-1.5 truncate text-[10px] font-semibold text-ink/60">{it.label}</span>
        </Link>
      ))}
      {stickers.slice(0, 2).map((s, i) => (
        <span key={s} className={cn("absolute z-30 rounded-full bg-white px-4 py-2 text-[13px] font-extrabold text-pink shadow-[0_10px_24px_-10px_rgba(255,79,184,0.6)]", STICKERS[i])}>
          {s}
        </span>
      ))}
    </div>
  );
}
