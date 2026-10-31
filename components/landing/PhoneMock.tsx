import { Heart, Search, X } from "lucide-react";
import Link from "next/link";
import type { Deal, Teaser } from "@/lib/data/public-deals";
import { retailerById } from "@/lib/data/retailers";
import { cn, peso } from "@/lib/utils";

const CHIPS = ["All", "Gadgets", "Fashion", "Beauty", "Home"];

/**
 * The hero's phone, drawn in code: Lovioo's search, category chips and one swipe card. The card is a real product
 * from today's public deals (or the catalogue teaser when no price is verified yet), never a made-up one.
 */
export function PhoneMock({ deal, teaser, className }: { deal?: Deal; teaser?: Teaser; className?: string }) {
  const item = deal ?? teaser;
  const href = deal ? `/auth?next=${encodeURIComponent(`/product/${deal.slug}`)}` : "/auth?next=/swipe";
  return (
    <div className={cn("relative mx-auto w-[280px] rotate-[4deg] sm:w-[300px]", className)} aria-label="Lovioo on a phone">
      <div className="rounded-[2.75rem] bg-ink p-2.5 shadow-[0_40px_80px_-30px_rgba(17,17,17,0.55)]">
        <div className="relative overflow-hidden rounded-[2.2rem] bg-white">
          <div className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-ink" aria-hidden />
          <div className="px-4 pb-5 pt-11">
            <p className="text-[15px] font-extrabold tracking-[-0.01em]">
              <span className="text-pink">♥</span> Lovioo
            </p>
            <p className="mt-3 rounded-2xl bg-pink-soft px-3 py-2 text-[12px] font-semibold text-ink/80">What are you looking for today?</p>
            <p className="mt-2 flex items-center gap-2 rounded-full border border-ink/10 px-3 py-2 text-[12px] text-ink/40">
              <Search className="h-3.5 w-3.5" /> Find anything…
            </p>
            <div className="mt-3 flex gap-1.5 overflow-hidden">
              {CHIPS.map((c, i) => (
                <span key={c} className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold", i === 0 ? "bg-pink text-white" : "bg-surface text-ink/60")}>
                  {c}
                </span>
              ))}
            </div>

            {item ? (
              <div className="mt-3 rounded-3xl bg-white p-2.5 shadow-[0_12px_30px_-14px_rgba(255,79,184,0.5)] ring-1 ring-pink/15">
                <div className="relative aspect-square overflow-hidden rounded-2xl" style={{ background: "radial-gradient(circle at 30% 20%, #fff 0%, #FFE8F1 75%)" }}>
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center text-5xl" aria-hidden>
                      {item.emoji}
                    </span>
                  )}
                  <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white text-pink shadow-sm">
                    <Heart className="h-3.5 w-3.5 fill-pink" />
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-snug">{item.name}</p>
                {deal && (
                  <p className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-[15px] font-extrabold text-pink">{peso(deal.price)}</span>
                    {deal.off > 0 && <span className="text-[10px] text-ink/40 line-through">{peso(deal.originalPrice)}</span>}
                  </p>
                )}
                {deal && <p className="mt-1 inline-flex rounded-full bg-surface px-2 py-0.5 text-[9px] font-semibold text-ink/60">{retailerById(deal.retailer as never).name}</p>}
                <Link href={href} className="mt-2 flex h-8 items-center justify-center rounded-full bg-pink text-[11px] font-bold text-white">
                  {deal ? "View Deals" : "See prices"}
                </Link>
              </div>
            ) : (
              <div className="mt-3 aspect-[4/5] rounded-3xl bg-pink-soft" aria-hidden />
            )}

            <div className="mt-3 flex items-center justify-center gap-5" aria-hidden>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink/60 shadow-[0_6px_16px_-6px_rgba(17,17,17,0.3)]">
                <X className="h-5 w-5" />
              </span>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-pink shadow-[0_6px_16px_-6px_rgba(255,79,184,0.6)]">
                <Heart className="h-5 w-5 fill-pink" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
