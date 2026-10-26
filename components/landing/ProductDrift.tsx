import Link from "next/link";
import { ProductImage } from "@/components/product/ProductImage";
import { PRODUCTS, isPriced, lowestPrice } from "@/lib/data/products";
import type { Product } from "@/lib/types";
import { cn, peso } from "@/lib/utils";

/** Products for the drifting rows: real photos first, then the rest as soft emoji tiles. */
export function driftRows() {
  const withPhoto = PRODUCTS.filter((p) => p.image);
  const rest = PRODUCTS.filter((p) => !p.image);
  const picks = [...withPhoto, ...rest].slice(0, 20);
  return [picks.filter((_, i) => i % 2 === 0), picks.filter((_, i) => i % 2 === 1)];
}

function DriftCard({ product }: { product: Product }) {
  const priced = isPriced(product);
  return (
    <Link href={`/product/${product.slug}`} className="group block w-40 shrink-0 sm:w-48" tabIndex={-1}>
      <ProductImage product={product} className="aspect-[4/5] rounded-2xl transition duration-500 group-hover:scale-[1.02]" emojiSize="text-5xl" />
      <p className="mt-2 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-midnight/45">{product.brand}</p>
      <p className="truncate text-[13px] text-midnight/80">{product.name}</p>
      <p className="text-[13px] font-semibold text-midnight">{priced ? peso(lowestPrice(product)) : "See prices"}</p>
    </Link>
  );
}

export function DriftRow({ products, reverse }: { products: Product[]; reverse?: boolean }) {
  if (!products.length) return null;
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className={cn("flex w-max gap-4 hover:[animation-play-state:paused] motion-reduce:animate-none", reverse ? "animate-drift-reverse" : "animate-drift")}>
        {[...products, ...products].map((p, i) => (
          <div key={`${p.id}-${i}`} aria-hidden={i >= products.length || undefined}>
            <DriftCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Home page: an editorial landing built around describing what you want in your own words. */
