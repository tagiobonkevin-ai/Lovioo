import Link from "next/link";
import { HeartButton } from "@/components/product/HeartButton";
import { bestOffer, discountPct, isPriced, lowestPrice } from "@/lib/data/products";
import { retailerById } from "@/lib/data/retailers";
import type { Product } from "@/lib/types";
import { cn, peso } from "@/lib/utils";

/**
 * A product on the home page, in the same card as the app: the photo on a white card, the details on a light-pink
 * panel with a round save button. Prices only when verified.
 */
export function HomeProductCard({ product, className }: { product: Product; className?: string }) {
  const priced = isPriced(product);
  const best = bestOffer(product);
  const pct = priced ? discountPct(product) : 0;
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-[1.75rem] bg-white p-2 shadow-[0_18px_40px_-30px_rgba(17,17,17,0.35)] ring-1 ring-ink/[0.06] transition hover:-translate-y-1 hover:shadow-[0_26px_50px_-26px_rgba(255,79,184,0.55)]",
        className,
      )}
    >
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-[1.4rem]" style={{ background: "radial-gradient(circle at 30% 20%, #fff 0%, #FFE8F1 75%)" }}>
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
        ) : (
          <span className="grid h-full w-full place-items-center text-5xl" aria-hidden>
            {product.emoji}
          </span>
        )}
      </Link>
      <div className="pointer-events-none absolute left-4 top-4 flex gap-1.5">
        {product.trending && <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-coral">🔥 Trending</span>}
        {pct > 0 && <span className="rounded-full bg-pink px-2 py-0.5 text-[10px] font-bold text-white">-{pct}%</span>}
      </div>
      <div className="mt-2 flex flex-1 flex-col rounded-[1.4rem] bg-pink-soft p-3.5">
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-pink">{product.brand}</p>
        <Link href={`/product/${product.slug}`} className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug hover:text-pink">
          {product.name}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            {priced ? (
              <>
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-[17px] font-extrabold">{peso(lowestPrice(product))}</span>
                  {best && best.originalPrice > best.price && <span className="text-[11px] text-ink/40 line-through">{peso(best.originalPrice)}</span>}
                </p>
                {best && <p className="text-[11px] text-ink/50">on {retailerById(best.retailer).name}</p>}
              </>
            ) : (
              <Link href={`/product/${product.slug}`} className="text-[13px] font-bold text-pink">
                See where to buy
              </Link>
            )}
          </div>
          <HeartButton productId={product.id} size="lg" className="shrink-0 !bg-white shadow-[0_8px_20px_-8px_rgba(255,79,184,0.6)]" />
        </div>
      </div>
    </div>
  );
}
