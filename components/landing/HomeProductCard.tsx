import Link from "next/link";
import { isPriced, lowestPrice, bestOffer, discountPct } from "@/lib/data/products";
import { retailerById } from "@/lib/data/retailers";
import type { Product } from "@/lib/types";
import { cn, peso } from "@/lib/utils";

/** A product on the home page: photo on the brand's light pink, brand, name and — only when verified — its price. */
export function HomeProductCard({ product, className }: { product: Product; className?: string }) {
  const priced = isPriced(product);
  const best = bestOffer(product);
  const pct = priced ? discountPct(product) : 0;
  return (
    <Link href={`/product/${product.slug}`} className={cn("group block", className)}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl" style={{ background: "radial-gradient(circle at 30% 20%, #fff 0%, #FFE8F1 75%)" }}>
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
        ) : (
          <span className="grid h-full w-full place-items-center text-5xl" aria-hidden>
            {product.emoji}
          </span>
        )}
        {pct > 0 && <span className="absolute left-2 top-2 rounded-full bg-pink px-2.5 py-1 text-[11px] font-bold text-white">-{pct}%</span>}
        {product.trending && <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-coral">🔥 Trending</span>}
      </div>
      <p className="mt-3 truncate text-[11px] font-bold uppercase tracking-[0.08em] text-ink/45">{product.brand}</p>
      <p className="mt-0.5 line-clamp-2 text-[14px] font-semibold leading-snug">{product.name}</p>
      {priced ? (
        <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-[13px]">
          <span className="text-[17px] font-extrabold text-pink">{peso(lowestPrice(product))}</span>
          {best && best.originalPrice > best.price && <span className="text-ink/40 line-through">{peso(best.originalPrice)}</span>}
          {best && <span className="text-ink/50">on {retailerById(best.retailer).name}</span>}
        </p>
      ) : (
        <p className="mt-1 text-[13px] font-semibold text-pink">See where to buy</p>
      )}
    </Link>
  );
}
