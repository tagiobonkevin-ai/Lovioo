"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { Heart, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { saveOrJoin } from "@/lib/signup-nudge";
import { useLovioo } from "@/lib/store";
import { peso } from "@/lib/utils";

export interface SwipeDemoItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  emoji: string;
  /** Only when the price is verified. */
  price?: number;
}

/**
 * A small, playable taste of Swipe on the home page, built from today's public deals: drag or tap ✕ / ♥. A love
 * invites a guest to join, where the real deck saves it.
 */
export function SwipeDemo({ items }: { items: SwipeDemoItem[] }) {
  const [index, setIndex] = useState(0);
  const [exit, setExit] = useState(0);
  const save = useLovioo((s) => s.save);
  const signedIn = useLovioo((s) => !!s.user);
  const current = items[index];
  const next = items[index + 1];

  const decide = (love: boolean) => {
    if (!current) return;
    if (love) saveOrJoin(current.id, save, signedIn);
    setExit(love ? 1 : -1);
    setIndex((i) => i + 1);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 90) decide(true);
    else if (info.offset.x < -90) decide(false);
  };

  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div className="relative aspect-[4/5]">
        {next && <Card item={next} className="scale-[0.94] opacity-70" />}
        <AnimatePresence custom={exit}>
          {current ? (
            <motion.div
              key={current.id}
              className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={onDragEnd}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, x: 0, rotate: 0 }}
              exit={{ x: exit * 360, rotate: exit * 18, opacity: 0, transition: { duration: 0.3 } }}
              whileDrag={{ rotate: 4 }}
            >
              <Card item={current} />
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 grid place-items-center rounded-[2rem] bg-pink-soft p-6 text-center">
              <div>
                <p className="font-display text-[22px] font-medium">That was a taste 💘</p>
                <p className="mt-1 text-sm text-ink/60">The full deck learns what you love with every swipe.</p>
                <Link href="/swipe" className="btn-primary mt-4">
                  Start Swiping
                </Link>
                <button onClick={() => setIndex(0)} className="mt-3 flex w-full items-center justify-center gap-1 text-sm font-semibold text-ink/55">
                  <RotateCcw className="h-3.5 w-3.5" /> Play again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-5 flex items-center justify-center gap-5">
        <button
          onClick={() => decide(false)}
          disabled={!current}
          aria-label="Skip"
          className="grid h-14 w-14 place-items-center rounded-full bg-white text-ink/60 shadow-[0_10px_24px_-10px_rgba(17,17,17,0.35)] transition active:scale-95 disabled:opacity-40"
        >
          <X className="h-6 w-6" />
        </button>
        <button
          onClick={() => decide(true)}
          disabled={!current}
          aria-label="Love it"
          className="grid h-16 w-16 place-items-center rounded-full bg-brand text-white shadow-pop transition active:scale-95 disabled:opacity-40"
        >
          <Heart className="h-7 w-7 fill-white" />
        </button>
      </div>
    </div>
  );
}

function Card({ item, className = "" }: { item: SwipeDemoItem; className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_50px_-24px_rgba(255,79,184,0.55)] ring-1 ring-pink/15 ${className}`}>
      <div className="h-full w-full" style={{ background: "radial-gradient(circle at 30% 20%, #fff 0%, #FFE8F1 75%)" }}>
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.name} draggable={false} className="h-full w-full select-none object-cover" />
        ) : (
          <span className="grid h-full place-items-center text-7xl" aria-hidden>
            {item.emoji}
          </span>
        )}
      </div>
      <Link href={`/product/${item.slug}`} className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent p-4 pt-12 text-white">
        <span className="block truncate text-[10px] font-bold uppercase tracking-[0.1em] text-white/75">{item.brand}</span>
        <span className="mt-0.5 line-clamp-2 text-[14px] font-bold leading-snug">{item.name}</span>
        {item.price !== undefined && <span className="mt-1 block text-[17px] font-extrabold">{peso(item.price)}</span>}
      </Link>
    </div>
  );
}
