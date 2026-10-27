import Link from "next/link";
import { Lock } from "lucide-react";
import { categoryById } from "@/lib/data/categories";
import type { Teaser } from "@/lib/data/public-deals";
import { cn } from "@/lib/utils";

/**
 * A front-page product with no price on it. Shown while the catalogue has no verified prices: the photo,
 * the brand and the name are real, and the price is honestly behind an account rather than invented.
 */
export function TeaserCard({ teaser, className }: { teaser: Teaser; className?: string }) {
  const tint = categoryById(teaser.category as never).tint;
  return (
    <Link href="/auth?next=/discover" className={cn("group block", className)}>
      <div className="relative aspect-[3/4] overflow-hidden" style={{ background: `linear-gradient(160deg, #fff 0%, ${tint} 100%)` }}>
        {teaser.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={teaser.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
        ) : (
          <span className="grid h-full w-full place-items-center text-5xl" aria-hidden>
            {teaser.emoji}
          </span>
        )}
      </div>
      <p className="mt-3 text-[13px] leading-[1.54] text-ink/50">{teaser.brand}</p>
      <p className="text-[13px] leading-[1.54] text-ink">{teaser.name}</p>
      <p className="mt-0.5 inline-flex items-center gap-1 text-[13px] leading-[1.54] text-ink/45">
        <Lock className="h-3 w-3" aria-hidden /> Join free to see the price
      </p>
    </Link>
  );
}
