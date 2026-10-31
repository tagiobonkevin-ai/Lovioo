"use client";

import { BadgeCheck, Handshake } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BrandCard } from "@/components/brand/BrandCrush";
import { ProductCard } from "@/components/product/ProductCard";
import { brandOf, brandProducts, partnerBrands } from "@/lib/data/brands";
import { categoryById } from "@/lib/data/categories";
import { PRODUCTS } from "@/lib/data/products";
import { CONTACT_EMAIL } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The full Lovioo Store (ready for launch; /store shows "Coming soon" until then). To launch, render this from
 * app/(app)/store/page.tsx so it stays members-only like the rest of the catalogue, and remove app/store.
 *
 * Lovioo Store: products from Lovioo Brand Partners, in one place. Lovioo doesn't sell anything itself: every product
 * links to the brand's own store or marketplace shop, and only brands with a real partnership are listed.
 */
export function StoreView() {
  const brands = partnerBrands();
  const key = brands.map((b) => b.id).join(",");
  const products = useMemo(() => {
    const ids = new Set(key.split(","));
    return PRODUCTS.filter((p) => ids.has(brandOf(p)?.id ?? ""));
  }, [key]);
  const categories = [...new Set(products.map((p) => p.category))];
  const [cat, setCat] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const shown = products.filter((p) => (!cat || p.category === cat) && (!brand || brandOf(p)?.id === brand));

  return (
    <div className="space-y-10">
      <header className="rounded-[2rem] bg-white p-6 ring-1 ring-ink/[0.06] sm:p-10">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-pink">
          <Handshake className="h-3.5 w-3.5" /> Lovioo Store
        </p>
        <h1 className="mt-2 font-display text-[34px] font-medium leading-[1.15] tracking-[-0.01em] sm:text-[44px]">
          Shop Straight From <span className="block text-pink">Our Brand Partners.</span>
        </h1>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ink/60">
          Products added by the brands themselves and checked by the Lovioo team. Tap through to buy on the brand&apos;s official store or their Shopee,
          Lazada or TikTok Shop page.
        </p>
      </header>

      {brands.length === 0 ? (
        <div className="rounded-[2rem] bg-white p-10 text-center ring-1 ring-ink/[0.06]">
          <p className="text-4xl" aria-hidden>
            🤝
          </p>
          <p className="mt-3 font-semibold">Our first Brand Partners are joining soon.</p>
          <p className="mt-1 text-sm text-ink/55">
            Are you a brand? Email <b>{CONTACT_EMAIL}</b> to become a Lovioo Brand Partner.
          </p>
        </div>
      ) : (
        <>
          <section>
            <h2 className="flex items-center gap-2 text-[18px] leading-[1.5]">
              <BadgeCheck className="h-5 w-5 text-pink" /> Brand Partners
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {brands.map((b) => (
                <BrandCard key={b.id} brand={b} className="w-full" />
              ))}
            </div>
          </section>

          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-[18px] leading-[1.5]">
                All partner products <span className="text-ink/40">· {shown.length}</span>
              </h2>
            </div>
            <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
              <Chip on={!cat && !brand} onClick={() => (setCat(null), setBrand(null))}>
                All
              </Chip>
              {categories.map((c) => (
                <Chip key={c} on={cat === c} onClick={() => setCat(cat === c ? null : c)}>
                  {categoryById(c).emoji} {categoryById(c).name}
                </Chip>
              ))}
              {brands.length > 1 &&
                brands
                  .filter((b) => brandProducts(b).length)
                  .map((b) => (
                    <Chip key={b.id} on={brand === b.id} onClick={() => setBrand(brand === b.id ? null : b.id)}>
                      {b.name}
                    </Chip>
                  ))}
            </div>
            {shown.length ? (
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {shown.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-ink/50">
                Our partners&apos; products appear here as soon as Lovioo approves them. <Link href="/discover" className="font-semibold text-pink">Keep discovering</Link>
              </p>
            )}
          </section>
        </>
      )}
      <p className="text-center text-xs text-ink/45">
        Lovioo may earn a commission when you buy through these links, at no extra cost to you. Purchases are made on each store&apos;s own site.
      </p>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold ring-1 transition", on ? "bg-pink text-white ring-pink" : "bg-white text-ink/70 ring-ink/10 hover:ring-pink")}>
      {children}
    </button>
  );
}
