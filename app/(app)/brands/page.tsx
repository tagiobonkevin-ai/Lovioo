"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { BrandCard } from "@/components/brand/BrandCrush";
import { brandProducts, sortedBrands } from "@/lib/data/brands";

export default function BrandsPage() {
  const [q, setQ] = useState("");
  // A brand with nothing to show is a dead end: its card opens an empty page. The seed created a row for
  // every brand name in the catalogue, so a few carry no published products -- keep those out until they do.
  const brands = sortedBrands()
    .filter((b) => brandProducts(b).length > 0)
    .filter((b) => !q || b.name.toLowerCase().includes(q.toLowerCase()));
  const featured = brands.filter((b) => b.featured);
  const rest = brands.filter((b) => !b.featured);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/40">Brand Crush 💘</p>
        <h1 className="mt-1 text-[30px] leading-[1.35]">Shop by brand</h1>
        <p className="mt-1 max-w-md text-sm text-ink/55">Tap a brand to see every product it has on Lovioo, with prices across stores.</p>
        <label className="relative mt-5 block max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a brand"
            className="w-full rounded-full border border-ink/15 bg-white py-3 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-ink/40"
            aria-label="Find a brand"
          />
        </label>
      </div>

      {featured.length > 0 && <BrandGrid title="Featured partners" brands={featured} />}
      <BrandGrid title={featured.length ? "More brands" : "All brands"} brands={rest} />
      {brands.length === 0 && <p className="py-10 text-center text-sm text-ink/50">No brand matches “{q}”.</p>}
    </div>
  );
}

function BrandGrid({ title, brands }: { title: string; brands: ReturnType<typeof sortedBrands> }) {
  if (!brands.length) return null;
  return (
    <section>
      <h2 className="text-[18px] leading-[1.5]">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {brands.map((b) => (
          <BrandCard key={b.id} brand={b} className="w-full" />
        ))}
      </div>
    </section>
  );
}
