"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, Layers, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { toast, useHydrated } from "@/components/Providers";
import { bestOffer, discountPct, productById } from "@/lib/data/products";
import { getInsight } from "@/lib/insights";
import { useLovioo } from "@/lib/store";
import type { Product } from "@/lib/types";
import { cn, peso } from "@/lib/utils";

type Collection = "all" | "drops" | "swipe";

export default function SavedPage() {
  const hydrated = useHydrated();
  const { saved, alerts, swipes, user, setAlert, toggleAlert, removeAlert } = useLovioo();
  const [tab, setTab] = useState<"saved" | "alerts">("saved");
  const [collection, setCollection] = useState<Collection>("all");

  if (!hydrated) return <div className="h-64 animate-pulse rounded-3xl bg-white/60" />;

  const products = saved.map(productById).filter(Boolean) as Product[];
  const swipeLoved = new Set(swipes.filter((s) => s.action !== "nope").map((s) => s.productId));
  const isDrop = (p: Product) => discountPct(p) >= 20 || getInsight(p).verdict === "buy";
  const visible = products.filter((p) => (collection === "drops" ? isDrop(p) : collection === "swipe" ? swipeLoved.has(p.id) : true));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Your loves 💖</h1>
          <p className="text-sm text-midnight/60">Manage your wishlist and price alerts.</p>
        </div>
        {!user && (
          <Link href="/auth?next=/saved" className="rounded-2xl bg-blush px-4 py-2.5 text-sm text-midnight/80">
            <b className="text-pink">Sign in</b> to keep your saves across devices
          </Link>
        )}
      </div>

      <div className="flex border-b border-line">
        {(
          [
            ["saved", `Saved items (${products.length})`],
            ["alerts", `Price alerts (${alerts.length})`],
          ] as const
        ).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={cn("-mb-px flex-1 border-b-2 pb-3 text-sm font-semibold sm:flex-none sm:px-8", tab === id ? "border-pink text-pink" : "border-transparent text-midnight/50")}>
            {label}
          </button>
        ))}
      </div>

      {tab === "saved" ? (
        products.length === 0 ? (
          <Empty />
        ) : (
          <>
            <div className="flex gap-2">
              {(
                [
                  ["all", "All"],
                  ["drops", "🔥 Great deals"],
                  ["swipe", "💘 Swipe loves"],
                ] as const
              ).map(([id, label]) => (
                <button key={id} onClick={() => setCollection(id)} className={cn("chip", collection === id && "chip-active")}>
                  {label}
                </button>
              ))}
            </div>
            <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <AnimatePresence>
                {visible.map((p) => (
                  <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                    <div className="relative">
                      <ProductCard product={p} />
                      {!alerts.some((a) => a.productId === p.id) && (
                        <button
                          onClick={() => {
                            setAlert(p.id);
                            toast({ title: "Price alert on 🔔", body: p.name, kind: "ok" });
                          }}
                          className="absolute left-3 top-12 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-grape shadow-sm"
                        >
                          <Bell className="h-3 w-3" /> Alert me
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            {visible.length === 0 && <p className="text-sm text-midnight/50">Nothing in this collection yet.</p>}
          </>
        )
      ) : alerts.length === 0 ? (
        <div className="card p-10 text-center">
          <span className="text-5xl">🔔</span>
          <p className="mt-3 font-bold">No price alerts yet</p>
          <p className="text-sm text-midnight/60">Super-love ⭐ a product in Swipe or tap “Price alert” on any product.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a) => {
            const p = productById(a.productId);
            if (!p) return null;
            const now = bestOffer(p);
            const hit = now.price <= a.targetPrice;
            return (
              <li key={a.productId} className={cn("card flex flex-wrap items-center gap-4 p-4", hit && a.enabled && "ring-2 ring-emerald-400")}>
                <Link href={`/product/${p.slug}`}>
                  <ProductImage product={p} className="h-16 w-16 rounded-2xl" emojiSize="text-3xl" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${p.slug}`} className="line-clamp-1 font-semibold hover:text-pink">
                    {p.name}
                  </Link>
                  <p className="flex items-center gap-1.5 text-sm text-midnight/60">
                    Now {peso(now.price)} on <RetailerBadge id={now.retailer} size="xs" />
                    {hit && a.enabled && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">PRICE DROPPED!</span>}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-midnight/60">Alert under</span>
                  <span className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight/40">₱</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={a.targetPrice}
                      onChange={(e) => setAlert(p.id, Math.max(0, Number(e.target.value)))}
                      className="w-28 rounded-xl border border-line py-2 pl-7 pr-2 text-sm outline-none focus:border-pink"
                    />
                  </span>
                </label>
                <button
                  onClick={() => toggleAlert(p.id)}
                  role="switch"
                  aria-checked={a.enabled}
                  aria-label="Toggle alert"
                  className={cn("relative h-7 w-12 rounded-full transition", a.enabled ? "bg-pink" : "bg-line")}
                >
                  <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", a.enabled ? "left-6" : "left-1")} />
                </button>
                <button onClick={() => removeAlert(p.id)} className="grid h-9 w-9 place-items-center rounded-full text-midnight/40 hover:bg-blush hover:text-coral" aria-label="Delete alert">
                  <Trash2 className="h-4 w-4" />
                </button>
                {!a.enabled && <BellOff className="h-4 w-4 text-midnight/30" aria-hidden />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="card grid place-items-center p-12 text-center">
      <span className="text-6xl">💘</span>
      <p className="mt-3 text-lg font-bold">Nothing saved yet</p>
      <p className="max-w-sm text-sm text-midnight/60">Swipe right on products you love or tap the heart on any product — they&apos;ll show up here.</p>
      <Link href="/swipe" className="btn-gradient mt-5">
        <Layers className="h-4 w-4" /> Start swiping
      </Link>
    </div>
  );
}
