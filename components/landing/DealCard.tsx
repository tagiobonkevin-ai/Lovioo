import Link from "next/link";
import type { Deal } from "@/lib/data/public-deals";
import { retailerById } from "@/lib/data/retailers";
import { cn, peso } from "@/lib/utils";

/**
 * A front-page product: photo, brand, name and the real price. Guests can see these; tapping one asks them to
 * create an account, which is where the rest of the catalogue lives.
 */
export function DealCard({ deal, className }: { deal: Deal; className?: string }) {
  return (
    <Link href={`/auth?next=${encodeURIComponent(`/product/${deal.slug}`)}`} className={cn("group block", className)}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl" style={{ background: "linear-gradient(160deg, #fff 0%, #FFE8F1 100%)" }}>
        {deal.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={deal.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
        ) : (
          <span className="grid h-full w-full place-items-center text-5xl" aria-hidden>
            {deal.emoji}
          </span>
        )}
        {deal.off > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-pink px-2.5 py-1 text-[11px] font-bold text-white">-{deal.off}%</span>
        )}
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink/45">{deal.brand}</p>
      <p className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-ink">{deal.name}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-[13px]">
        <span className="text-[17px] font-extrabold text-pink">{peso(deal.price)}</span>
        {deal.off > 0 && <span className="text-ink/40 line-through">{peso(deal.originalPrice)}</span>}
      </p>
      <p className="mt-1 inline-flex rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-ink/60">{retailerById(deal.retailer as never).name}</p>
    </Link>
  );
}
