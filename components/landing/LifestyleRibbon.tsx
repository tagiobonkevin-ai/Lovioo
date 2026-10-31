import { cn } from "@/lib/utils";

/** Lovioo's lifestyle photos (public/images/home). Decorative: they show the mood, not real shoppers or products. */
export const LIFESTYLE_PHOTOS = [
  "shopper-phone",
  "beauty-products",
  "headphones",
  "friends-shopping",
  "bag-sneakers",
  "living-room",
  "skincare",
  "phone-watch",
  "family-tablet",
  "kitchen",
  "streetwear",
  "sports",
  "pet",
  "gaming-tech",
  "travel",
].map((name) => `/images/home/${name}.webp`);

/**
 * A slowly drifting row of lifestyle photos under the hero. Two copies sit side by side so the loop is seamless;
 * it stands still for people who prefer reduced motion and pauses on hover.
 */
export function LifestyleRibbon({ className }: { className?: string }) {
  const row = [...LIFESTYLE_PHOTOS, ...LIFESTYLE_PHOTOS];
  return (
    <div
      className={cn("group relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]", className)}
      aria-hidden
    >
      <ul className="flex w-max animate-drift gap-3 group-hover:[animation-play-state:paused] motion-reduce:animate-none sm:gap-4">
        {row.map((src, i) => (
          <li key={i} className="h-36 w-36 shrink-0 overflow-hidden rounded-[1.75rem] bg-pink-soft sm:h-44 sm:w-44 lg:h-52 lg:w-52">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" width={308} height={305} loading={i < 8 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A tidy wall of small lifestyle photos for the brand statement. */
export function LifestyleMosaic({ className }: { className?: string }) {
  const tiles = Array.from({ length: 18 }, (_, i) => `/images/home/mosaic/${String(i + 1).padStart(2, "0")}.webp`);
  return (
    <ul className={cn("grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3", className)} aria-hidden>
      {tiles.map((src, i) => (
        <li key={src} className={cn("aspect-[4/3] overflow-hidden rounded-2xl bg-pink-soft", i >= 12 && "hidden sm:block")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </li>
      ))}
    </ul>
  );
}
