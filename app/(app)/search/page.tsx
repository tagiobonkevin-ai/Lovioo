"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, SlidersHorizontal, Star, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { CATEGORIES, categoryById } from "@/lib/data/categories";
import { BRANDS, PRODUCTS, discountPct, lowestPrice } from "@/lib/data/products";
import { ALL_RETAILERS, RETAILERS } from "@/lib/data/retailers";
import { getInsight } from "@/lib/insights";
import type { CategoryId, Product, RetailerId } from "@/lib/types";
import { cn, peso } from "@/lib/utils";

const SORTS = [
  { id: "relevant", label: "Most relevant" },
  { id: "deal", label: "Best deal score" },
  { id: "discount", label: "Biggest discount" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "rating", label: "Top rated" },
  { id: "trending", label: "Trending" },
];
const PRICE_BANDS = [
  { label: "Under ₱500", min: 0, max: 500 },
  { label: "₱500 – ₱2,000", min: 500, max: 2000 },
  { label: "₱2,000 – ₱10,000", min: 2000, max: 10000 },
  { label: "₱10,000+", min: 10000, max: Infinity },
];
const PAGE = 12;

interface Filters {
  categories: CategoryId[];
  brands: string[];
  platforms: RetailerId[];
  band: number | null;
  min: string;
  max: string;
  rating: number;
  onSale: boolean;
}

function matches(p: Product, q: string) {
  if (!q) return true;
  const hay = [p.name, p.brand, p.subcategory, categoryById(p.category).name, ...p.tags].join(" ").toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w.replace(/s$/, "")));
}

function SearchInner() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const [sort, setSort] = useState(params.get("sort") ?? "relevant");
  const [f, setF] = useState<Filters>({
    categories: params.get("category") ? [params.get("category") as CategoryId] : [],
    brands: [],
    platforms: [],
    band: null,
    min: "",
    max: "",
    rating: 0,
    onSale: false,
  });
  const [shown, setShown] = useState(PAGE);
  const [drawer, setDrawer] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");

  const results = useMemo(() => {
    const min = f.min ? Number(f.min) : f.band !== null ? PRICE_BANDS[f.band].min : 0;
    const max = f.max ? Number(f.max) : f.band !== null ? PRICE_BANDS[f.band].max : Infinity;
    const list = PRODUCTS.filter((p) => {
      const price = lowestPrice(p);
      return (
        matches(p, q) &&
        (!f.categories.length || f.categories.includes(p.category)) &&
        (!f.brands.length || f.brands.includes(p.brand)) &&
        (!f.platforms.length || p.offers.some((o) => f.platforms.includes(o.retailer))) &&
        price >= min &&
        price <= max &&
        p.rating >= f.rating &&
        (!f.onSale || discountPct(p) >= 10)
      );
    });
    const by: Record<string, (a: Product, b: Product) => number> = {
      relevant: (a, b) => Number(!!b.trending) - Number(!!a.trending) || b.reviewCount - a.reviewCount,
      deal: (a, b) => getInsight(b).dealScore - getInsight(a).dealScore,
      discount: (a, b) => discountPct(b) - discountPct(a),
      "price-asc": (a, b) => lowestPrice(a) - lowestPrice(b),
      "price-desc": (a, b) => lowestPrice(b) - lowestPrice(a),
      rating: (a, b) => b.rating - a.rating,
      trending: (a, b) => Number(!!b.trending) - Number(!!a.trending) || getInsight(b).dealScore - getInsight(a).dealScore,
    };
    return list.sort(by[sort] ?? by.relevant);
  }, [q, f, sort]);

  const update = (patch: Partial<Filters>) => {
    setF((prev) => ({ ...prev, ...patch }));
    setShown(PAGE);
  };
  const toggle = <K extends "categories" | "brands" | "platforms">(key: K, v: Filters[K][number]) =>
    update({ [key]: (f[key] as string[]).includes(v as string) ? (f[key] as string[]).filter((x) => x !== v) : [...f[key], v] } as Partial<Filters>);
  const activeCount = f.categories.length + f.brands.length + f.platforms.length + (f.band !== null ? 1 : 0) + (f.min || f.max ? 1 : 0) + (f.rating ? 1 : 0) + (f.onSale ? 1 : 0);
  const reset = () => update({ categories: [], brands: [], platforms: [], band: null, min: "", max: "", rating: 0, onSale: false });

  const title = q ? `“${q}”` : f.categories.length === 1 ? categoryById(f.categories[0]).name : "All products";

  const sidebar = (
    <div className="space-y-1">
      <div className="flex items-center justify-between pb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-midnight/50">Products: {results.length}</span>
        {activeCount > 0 && (
          <button onClick={reset} className="inline-flex items-center gap-1 rounded-full bg-midnight px-2.5 py-1 text-[11px] font-semibold text-white">
            Clear filters <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <FilterGroup title="Category">
        {CATEGORIES.map((c) => (
          <Check key={c.id} label={`${c.emoji} ${c.name}`} checked={f.categories.includes(c.id)} onChange={() => toggle("categories", c.id)} count={PRODUCTS.filter((p) => p.category === c.id && matches(p, q)).length} />
        ))}
      </FilterGroup>
      <FilterGroup title="Price range">
        {PRICE_BANDS.map((b, i) => (
          <Check key={b.label} label={b.label} checked={f.band === i} onChange={() => update({ band: f.band === i ? null : i, min: "", max: "" })} />
        ))}
        <div className="flex items-center gap-2 pt-2">
          <input className="input !rounded-xl !px-3 !py-2" inputMode="numeric" placeholder="Min ₱" value={f.min} onChange={(e) => update({ min: e.target.value.replace(/\D/g, ""), band: null })} aria-label="Minimum price" />
          <span className="text-midnight/40">–</span>
          <input className="input !rounded-xl !px-3 !py-2" inputMode="numeric" placeholder="Max ₱" value={f.max} onChange={(e) => update({ max: e.target.value.replace(/\D/g, ""), band: null })} aria-label="Maximum price" />
        </div>
      </FilterGroup>
      <FilterGroup title="Store">
        {ALL_RETAILERS.map((r) => (
          <Check key={r} label={RETAILERS[r].name} icon={<RetailerBadge id={r} size="xs" />} checked={f.platforms.includes(r)} onChange={() => toggle("platforms", r)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Brand" defaultOpen={false}>
        <input className="input mb-2 !rounded-xl !px-3 !py-2" placeholder="Find a brand" value={brandQuery} onChange={(e) => setBrandQuery(e.target.value)} />
        <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
          {BRANDS.filter((b) => b.toLowerCase().includes(brandQuery.toLowerCase())).map((b) => (
            <Check key={b} label={b} checked={f.brands.includes(b)} onChange={() => toggle("brands", b)} />
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Rating">
        {[4.5, 4.0].map((r) => (
          <Check key={r} label={`${r}+`} icon={<Star className="h-3.5 w-3.5 fill-sunset text-sunset" />} checked={f.rating === r} onChange={() => update({ rating: f.rating === r ? 0 : r })} />
        ))}
      </FilterGroup>
      <FilterGroup title="Deals">
        <Check label="On sale (10%+ off)" checked={f.onSale} onChange={() => update({ onSale: !f.onSale })} />
      </FilterGroup>
    </div>
  );

  return (
    <div>
      <nav className="mb-4 text-xs text-midnight/50">
        <Link href="/discover" className="hover:text-pink">Home</Link> <span className="mx-1.5">›</span>
        <Link href="/search" className="hover:text-pink">Search</Link>
        {f.categories.length === 1 && (
          <>
            <span className="mx-1.5">›</span>
            <span className="text-midnight/70">{categoryById(f.categories[0]).name}</span>
          </>
        )}
      </nav>
      <form
        className="mb-6 lg:hidden"
        onSubmit={(e) => {
          e.preventDefault();
          const v = new FormData(e.currentTarget).get("q");
          router.push(`/search?q=${encodeURIComponent(String(v ?? ""))}`);
        }}
      >
        <input name="q" defaultValue={q} key={q} className="input !rounded-full" placeholder="Search products, brands or stores" />
      </form>

      <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="card sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto p-5">{sidebar}</div>
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
              <p className="text-sm text-midnight/50">{results.length} results</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDrawer(true)} className="btn-ghost !py-2 lg:hidden">
                <SlidersHorizontal className="h-4 w-4" /> Filters {activeCount > 0 && <span className="rounded-full bg-pink px-1.5 text-[10px] text-white">{activeCount}</span>}
              </button>
              <label className="relative">
                <span className="sr-only">Sort by</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="appearance-none rounded-full border border-line bg-white py-2 pl-4 pr-9 text-sm font-medium outline-none focus:border-pink">
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      Sort: {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-midnight/50" />
              </label>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="card mt-6 grid place-items-center p-12 text-center">
              <span className="text-5xl">🔍</span>
              <p className="mt-3 font-bold">No matches yet</p>
              <p className="text-sm text-midnight/60">Try fewer filters or ask Lovioo AI for ideas.</p>
              <button onClick={reset} className="btn-primary mt-4">
                Clear filters
              </button>
            </div>
          ) : (
            <motion.div layout className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {results.slice(0, shown).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </motion.div>
          )}

          {results.length > shown && (
            <div className="mt-8 flex items-center rounded-full border border-line bg-white">
              <button onClick={() => setShown(shown + PAGE)} className="flex-1 py-3.5 text-sm font-semibold text-pink">
                Show next {Math.min(PAGE, results.length - shown)} of {results.length}
              </button>
            </div>
          )}
          {results.length > 0 && (
            <p className="mt-6 text-center text-xs text-midnight/40">
              Lowest price shown {peso(Math.min(...results.map(lowestPrice)))} · prices are set by each retailer
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-midnight/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[2rem] bg-white p-5 pb-8"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
              {sidebar}
              <button onClick={() => setDrawer(false)} className="btn-primary mt-4 w-full">
                Show {results.length} results
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterGroup({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-line/70 py-3">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-sm font-semibold">
        {title}
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>
      {open && <div className="mt-2 space-y-0.5">{children}</div>}
    </div>
  );
}

function Check({ label, checked, onChange, count, icon }: { label: string; checked: boolean; onChange: () => void; count?: number; icon?: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-midnight/80 hover:bg-blush/60">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded accent-pink" />
      {icon}
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-midnight/40">{count}</span>}
    </label>
  );
}

/** Remount when the URL changes so header searches and category links reset the filters. */
function KeyedSearch() {
  const params = useSearchParams();
  return <SearchInner key={params.toString()} />;
}

export default function SearchPage() {
  return (
    <Suspense>
      <KeyedSearch />
    </Suspense>
  );
}
