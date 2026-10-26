import Link from "next/link";
import { categoryById } from "@/lib/data/categories";
import type { Deal } from "@/lib/data/public-deals";
import { retailerById } from "@/lib/data/retailers";
import { cn, peso } from "@/lib/utils";

/**
 * A front-page product: photo, brand, name and the real price. Guests can see these; tapping one asks them to
 * create an account, which is where the rest of the catalogue lives.
 */
export function DealCard({ deal, className }: { deal: Deal; className?: string }) {
  const tint = categoryById(deal.category as never).tint;
  return (
    <Link href={`/auth?next=${encodeURIComponent(`/product/${deal.slug}`)}`} className={cn("group block", className)}>
      <div className="relative aspect-[3/4] overflow-hidden" style={{ background: `linear-gradient(160deg, #fff 0%, ${tint} 100%)` }}>
        {deal.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={deal.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
        ) : (
          <span className="grid h-full w-full place-items-center text-5xl" aria-hidden>
            {deal.emoji}
          </span>
        )}
        {deal.off > 0 && (
          <span className="absolute left-0 top-0 bg-ink px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-white">{deal.off}% off</span>
        )}
      </div>
      <p className="mt-3 text-[13px] leading-[1.54] text-ink/50">{deal.brand}</p>
      <p className="text-[13px] leading-[1.54] text-ink">{deal.name}</p>
      <p className="text-[13px] leading-[1.54] text-ink">
        <span className="font-medium">{peso(deal.price)}</span>
        {deal.off > 0 && <span className="ml-1.5 text-ink/40 line-through">{peso(deal.originalPrice)}</span>}
        <span className="ml-1.5 text-ink/45">on {retailerById(deal.retailer as never).name}</span>
      </p>
    </Link>
  );
}
