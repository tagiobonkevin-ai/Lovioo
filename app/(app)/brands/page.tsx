"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { BrandCard } from "@/components/brand/BrandCrush";
import { sortedBrands } from "@/lib/data/brands";

export default function BrandsPage() {
  const [q, setQ] = useState("");
  const brands = sortedBrands().filter((b) => !q || b.name.toLowerCase().includes(q.toLowerCase()));
  const featured = brands.filter((b) => b.featured);
  const rest = brands.filter((b) => !b.featured);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-dusk p-6 text-white sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sunset/40 blur-3xl" />
        <p className="text-sm font-semibold text-white/80">Brand Crush 💘</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Shop by brand</h1>
        <p className="mt-1 max-w-md text-sm text-white/80">Tap a brand to see every product it has on Lovioo, with prices across stores.</p>
        <label className="relative mt-5 block max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-midnight/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a brand" className="w-full rounded-full bg-white py-3 pl-11 pr-4 text-sm text-midnight outline-none" aria-label="Find a brand" />
        </label>
      </div>

      {featured.length > 0 && <BrandGrid title="Featured partners" brands={featured} />}
      <BrandGrid title={featured.length ? "More brands" : "All brands"} brands={rest} />
      {brands.length === 0 && <p className="py-10 text-center text-sm text-midnight/50">No brand matches “{q}”.</p>}
    </div>
  );
}

function BrandGrid({ title, brands }: { title: string; brands: ReturnType<typeof sortedBrands> }) {
  if (!brands.length) return null;
  return (
    <section>
      <h2 className="text-lg font-extrabold">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {brands.map((b) => (
          <BrandCard key={b.id} brand={b} className="w-full" />
        ))}
      </div>
    </section>
  );
}
