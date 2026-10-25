"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Layers, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CategoryBubbles } from "@/components/product/CategoryBubbles";
import { DealScoreRing } from "@/components/product/DealScore";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { useHydrated } from "@/components/Providers";
import { PRODUCTS } from "@/lib/data/products";
import { retailerById } from "@/lib/data/retailers";
import { getInsight } from "@/lib/insights";
import { scoreProducts } from "@/lib/recommend";
import { useLovioo } from "@/lib/store";
import { peso } from "@/lib/utils";

export default function Discover() {
  const hydrated = useHydrated();
  const user = useLovioo((s) => s.user);
  const prefs = useLovioo((s) => s.prefs);
  const swipes = useLovioo((s) => s.swipes);
  const saved = useLovioo((s) => s.saved);

  const recommended = useMemo(
    () =>
      hydrated
        ? scoreProducts({ prefs, likedIds: [...saved, ...swipes.filter((s) => s.action !== "nope").map((s) => s.productId)], nopedIds: swipes.filter((s) => s.action === "nope").map((s) => s.productId) })
        : PRODUCTS,
    [hydrated, prefs, saved, swipes],
  );
  const topDeals = useMemo(
    () =>
      [...PRODUCTS]
        .map((p) => ({ p, s: getInsight(p).dealScore }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 5)
        .map((x) => x.p),
    [],
  );
  const trending = PRODUCTS.filter((p) => p.trending);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-midnight/60">{hydrated && user ? `Good to see you, ${user.name.split(" ")[0]} 👋` : "Welcome to Lovioo 👋"}</p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">What are you loving today?</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <DealCarousel products={topDeals} />
        <div className="grid gap-4">
          <Link href="/swipe" className="group relative overflow-hidden rounded-[2rem] bg-midnight p-6 text-white">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-pink/40 blur-2xl" />
            <Layers className="h-8 w-8 text-pink" />
            <p className="mt-3 text-xl font-bold">Swipe mode 💘</p>
            <p className="mt-1 text-sm text-white/70">Love or pass — your feed learns your vibe with every swipe.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pink transition group-hover:gap-2">
              Start swiping <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <Link href="/ai" className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-grape/15 to-pink/15 p-6">
            <Sparkles className="h-8 w-8 text-grape" />
            <p className="mt-3 text-xl font-bold">Ask Lovioo AI</p>
            <p className="mt-1 text-sm text-midnight/70">“Skincare under ₱1,000” · “Should I buy now or wait?”</p>
          </Link>
        </div>
      </div>

      <CategoryBubbles />

      <section>
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-extrabold">Recommended for you</h2>
          <Link href="/search" className="text-sm font-semibold text-pink">
            See all
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {recommended.slice(0, 10).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-extrabold">Trending deals 🔥</h2>
          <Link href="/search?sort=trending" className="text-sm font-semibold text-pink">
            See all
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 mt-4 flex gap-4 overflow-x-auto px-4 pb-2">
          {trending.map((p) => (
            <ProductCard key={p.id} product={p} className="w-48 shrink-0" />
          ))}
        </div>
      </section>
    </div>
  );
}

function DealCarousel({ products }: { products: typeof PRODUCTS }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % products.length), 5000);
    return () => clearInterval(t);
  }, [products.length]);
  const p = products[i];
  const ins = getInsight(p);

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-brand-soft">
      <AnimatePresence mode="wait">
        <motion.div key={p.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="grid min-h-[280px] items-center gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <span className="chip border-none bg-white/80 text-pink">Top deal just for you</span>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">{p.name}</h2>
            <p className="mt-2 text-sm text-midnight/70">
              {peso(ins.bestOffer.price)} on {retailerById(ins.bestOffer.retailer).name} · {ins.headline}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Link href={`/product/${p.slug}`} className="btn-primary">
                Explore deal <ArrowRight className="h-4 w-4" />
              </Link>
              <DealScoreRing score={ins.dealScore} size={48} />
            </div>
          </div>
          <ProductImage product={p} className="mx-auto hidden aspect-square w-full max-w-[240px] rounded-3xl shadow-xl sm:block" emojiSize="text-8xl" />
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button onClick={() => setI((i - 1 + products.length) % products.length)} className="grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow" aria-label="Previous deal">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={() => setI((i + 1) % products.length)} className="grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow" aria-label="Next deal">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="absolute bottom-6 left-6 flex gap-1.5 sm:left-8">
        {products.map((_, k) => (
          <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-pink" : "w-1.5 bg-midnight/20"}`} />
        ))}
      </div>
    </div>
  );
}
