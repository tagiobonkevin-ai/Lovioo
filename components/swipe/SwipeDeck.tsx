"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flame, Heart, RotateCcw, Sparkles, Star, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductImage } from "@/components/product/ProductImage";
import { toast, useHydrated } from "@/components/Providers";
import { categoryById, VIBES } from "@/lib/data/categories";
import { isPriced, productById } from "@/lib/data/products";
import { getInsight } from "@/lib/insights";
import { swipeFeed } from "@/lib/recommend";
import { swipesToday, useLovioo, type SwipeAction } from "@/lib/store";
import type { Product, Vibe } from "@/lib/types";
import { cn, peso } from "@/lib/utils";
import { MatchModal } from "./MatchModal";
import { SwipeCard, type SwipeCardHandle } from "./SwipeCard";

type VibeFilter = Vibe | "under1k" | null;
const VIBE_CHIPS: { id: VibeFilter; label: string; emoji: string }[] = [
  { id: null, label: "For you", emoji: "💖" },
  ...VIBES,
  { id: "under1k", label: "Under ₱1k", emoji: "🪙" },
];
const MATCH_SCORE = 85;
const VISIBLE = 3;

export function SwipeDeck() {
  const hydrated = useHydrated();
  const { prefs, swipes, streak, dailyGoal, recordSwipe, undoSwipe, resetSwipes } = useLovioo();
  const [vibe, setVibe] = useState<VibeFilter>(null);
  // Deep links like /swipe?vibe=cozy (from the home screen vibe chips).
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("vibe");
    if (v === "under1k" || VIBES.some((x) => x.id === v)) setVibe(v as VibeFilter);
  }, []);
  const [queue, setQueue] = useState<Product[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [match, setMatch] = useState<Product | null>(null);
  const [sessionLoves, setSessionLoves] = useState<string[]>([]);
  const sinceMatch = useRef(99);
  const topRef = useRef<SwipeCardHandle>(null);
  const busy = useRef(false);

  const signals = useCallback(() => {
    const s = useLovioo.getState().swipes;
    return {
      prefs: useLovioo.getState().prefs,
      likedIds: s.filter((x) => x.action !== "nope").map((x) => x.productId),
      nopedIds: s.filter((x) => x.action === "nope").map((x) => x.productId),
      seen: new Set(s.map((x) => x.productId)),
    };
  }, []);

  // Build the deck once hydrated and whenever the vibe filter changes.
  useEffect(() => {
    if (!hydrated) return;
    const sig = signals();
    setQueue(swipeFeed(sig, sig.seen, vibe));
    setFlipped(false);
  }, [hydrated, vibe, signals, prefs]);

  const onSwiped = useCallback(
    (dir: SwipeAction) => {
      const top = queue[0];
      if (!top) return;
      recordSwipe(top.id, dir);
      busy.current = false;
      setFlipped(false);
      sinceMatch.current += 1;

      // Keep the cards already visible, re-rank everything behind them with the new taste signal.
      const sig = signals();
      const keep = queue.slice(1, VISIBLE);
      const keepIds = new Set(keep.map((p) => p.id));
      const rest = swipeFeed(sig, sig.seen, vibe).filter((p) => !keepIds.has(p.id));
      setQueue([...keep, ...rest]);

      if (dir !== "nope") {
        setSessionLoves((l) => [top.id, ...l]);
        const score = getInsight(top).dealScore;
        if (score >= MATCH_SCORE && sinceMatch.current >= 3) {
          sinceMatch.current = 0;
          setMatch(top);
        } else {
          toast({ title: dir === "super" ? "Super loved ⭐" : "Loved it!", body: dir === "super" ? "Saved + price alert on." : "Saved to your collection." });
        }
      }
    },
    [queue, recordSwipe, signals, vibe],
  );

  const act = useCallback(
    (dir: SwipeAction) => {
      if (busy.current || !queue.length || match) return;
      if (!topRef.current) return;
      busy.current = true;
      topRef.current.fly(dir);
    },
    [queue.length, match],
  );

  const undo = useCallback(() => {
    if (busy.current) return;
    const last = undoSwipe();
    if (!last) return;
    const p = productById(last.productId);
    if (!p) return;
    setSessionLoves((l) => l.filter((id) => id !== p.id));
    setQueue((q) => [p, ...q.filter((x) => x.id !== p.id)]);
    setFlipped(false);
    toast({ title: "Undone", body: p.name, kind: "ok" });
  }, [undoSwipe]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight") act("love");
      else if (e.key === "ArrowLeft") act("nope");
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        act("super");
      } else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key.toLowerCase() === "z" || e.key === "Backspace") undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, undo]);

  const today = hydrated ? swipesToday(swipes) : 0;
  const goalPct = Math.min(1, today / dailyGoal);
  const recentLoves = useMemo(
    () =>
      swipes
        .filter((s) => s.action !== "nope")
        .slice(-8)
        .reverse()
        .map((s) => productById(s.productId))
        .filter(Boolean) as Product[],
    [swipes],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_260px]">
      {/* Left rail: vibes + goal */}
      <aside className="order-1 min-w-0 space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Swipe. <span className="text-gradient">Love.</span> Shop.
          </h1>
          <p className="mt-1 hidden text-sm text-midnight/60 sm:block">Right to love, left to pass, up to super-love. Tap a card to flip it.</p>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {VIBE_CHIPS.map((v) => (
            <button key={String(v.id)} onClick={() => setVibe(v.id)} className={cn("chip shrink-0", vibe === v.id && "chip-active")}>
              <span>{v.emoji}</span> {v.label}
            </button>
          ))}
        </div>
        <div className="card hidden items-center gap-4 p-4 lg:flex">
          <GoalRing pct={goalPct} />
          <div>
            <p className="text-sm font-semibold">Daily vibe check</p>
            <p className="text-xs text-midnight/60">
              {today}/{dailyGoal} swipes today
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-coral">
              <Flame className="h-3.5 w-3.5" /> {hydrated ? streak : 0}-day streak
            </p>
          </div>
        </div>
        <div className="hidden rounded-3xl bg-midnight p-4 text-xs text-white/80 lg:block">
          <p className="mb-2 font-semibold text-white">Shortcuts</p>
          <p>← Nope · → Love · ↑ Super love</p>
          <p>Space flip · Z undo</p>
        </div>
      </aside>

      {/* Deck */}
      <section className="order-2 flex min-w-0 flex-col items-center">
        <div className="mb-3 flex w-full max-w-sm items-center justify-between text-xs font-medium text-midnight/60 lg:hidden">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
              <span className="block h-full bg-brand" style={{ width: `${goalPct * 100}%` }} />
            </span>
            {today}/{dailyGoal}
          </span>
          <span className="inline-flex items-center gap-1 text-coral">
            <Flame className="h-3.5 w-3.5" /> {hydrated ? streak : 0}
          </span>
        </div>

        {/* The height is measured off the real chrome rather than a guessed fraction of the screen: 225px of
            header, padding, title, chips and progress sit above, and 96px of action buttons plus the 64px tab bar
            sit below -- 392px that doesn't shrink when the screen does. Subtracting it keeps Love and Nope clear
            of the tab bar on a 320x568 iPhone SE as well as a 430x932 Pro Max; 520px caps the card on a desktop.
            `sm:h-[500px]` used to be here and was the bug: it applied from 640px WIDE, which is phone landscape,
            forcing a 500px card into a 390px-tall viewport. The 185px floor keeps the card whole there instead. */}
        <div className="relative h-[clamp(185px,calc(100dvh-392px),520px)] w-full max-w-sm select-none">
          {!hydrated ? (
            <div className="absolute inset-0 animate-pulse rounded-[2rem] bg-white/70" />
          ) : queue.length === 0 ? (
            <Recap loves={sessionLoves} vibe={vibe} onReset={() => { resetSwipes(); setSessionLoves([]); setVibe(null); const sig = signals(); setQueue(swipeFeed(sig, sig.seen, null)); }} onAllVibes={() => setVibe(null)} />
          ) : (
            // No AnimatePresence here: cards fly out themselves, and a lingering exiting card would null the top ref.
            queue
              .slice(0, VISIBLE)
              .map((p, i) => (
                <SwipeCard
                  key={p.id}
                  ref={i === 0 ? topRef : undefined}
                  product={p}
                  depth={i}
                  flipped={i === 0 && flipped}
                  onFlip={() => setFlipped((f) => !f)}
                  onSwiped={onSwiped}
                />
              ))
              .reverse()
          )}
        </div>

        <div className="mt-8 flex items-center gap-3 sm:gap-4">
          <ActionButton label="Undo" onClick={undo} className="h-11 w-11 text-sunset" disabled={!hydrated || swipes.length === 0}>
            <RotateCcw className="h-5 w-5" />
          </ActionButton>
          <ActionButton label="Nope" onClick={() => act("nope")} className="h-16 w-16 text-coral" disabled={!queue.length}>
            <X className="h-8 w-8" strokeWidth={3} />
          </ActionButton>
          <ActionButton label="Super love" onClick={() => act("super")} className="h-12 w-12 text-grape" disabled={!queue.length}>
            <Star className="h-6 w-6 fill-grape" />
          </ActionButton>
          <ActionButton label="Love" onClick={() => act("love")} className="h-16 w-16 bg-brand text-white" disabled={!queue.length}>
            <Heart className="h-8 w-8 fill-white" />
          </ActionButton>
          <ActionButton label="Flip card" onClick={() => setFlipped((f) => !f)} className="h-11 w-11 text-signal" disabled={!queue.length}>
            <Sparkles className="h-5 w-5" />
          </ActionButton>
        </div>
        <p className="mt-3 text-center text-[11px] text-midnight/50">
          {queue.length ? `${queue.length} picks in your deck` : ""}
        </p>
      </section>

      {/* Right rail: recent loves */}
      <aside className="order-3 min-w-0">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Recent loves 💘</p>
            <Link href="/saved" className="text-xs font-semibold text-pink">
              See all
            </Link>
          </div>
          {hydrated && recentLoves.length ? (
            <ul className="mt-3 grid grid-cols-4 gap-2 lg:grid-cols-2">
              <AnimatePresence initial={false}>
                {recentLoves.map((p) => (
                  <motion.li key={p.id} layout initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Link href={`/product/${p.slug}`} className="block overflow-hidden rounded-2xl">
                      <ProductImage product={p} className="aspect-square" emojiSize="text-3xl" />
                    </Link>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            <p className="mt-3 text-xs text-midnight/50">Swipe right on something you like — it lands here.</p>
          )}
        </div>
      </aside>

      <AnimatePresence>{match && <MatchModal product={match} onClose={() => setMatch(null)} />}</AnimatePresence>
    </div>
  );
}

function ActionButton({ children, label, onClick, className, disabled }: { children: React.ReactNode; label: string; onClick: () => void; className?: string; disabled?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn("grid place-items-center rounded-full bg-white shadow-soft ring-1 ring-black/5 disabled:opacity-40", className)}
    >
      {children}
    </motion.button>
  );
}

function GoalRing({ pct }: { pct: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <svg width={60} height={60} className="-rotate-90 shrink-0">
      <defs>
        <linearGradient id="goal" x1="0" x2="1">
          <stop offset="0%" stopColor="#FF2D9A" />
          <stop offset="100%" stopColor="#FFB84D" />
        </linearGradient>
      </defs>
      <circle cx={30} cy={30} r={r} stroke="#F6E3EC" strokeWidth={7} fill="none" />
      <circle cx={30} cy={30} r={r} stroke="url(#goal)" strokeWidth={7} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .4s" }} />
    </svg>
  );
}

function Recap({ loves, vibe, onReset, onAllVibes }: { loves: string[]; vibe: VibeFilter; onReset: () => void; onAllVibes: () => void }) {
  const products = loves.map(productById).filter(Boolean) as Product[];
  const cats = new Map<string, number>();
  products.forEach((p) => cats.set(p.category, (cats.get(p.category) ?? 0) + 1));
  const top = [...cats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const best = products.filter(isPriced).sort((a, b) => getInsight(b).dealScore - getInsight(a).dealScore)[0];

  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
      <div className="bg-brand p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Deck complete</p>
        <p className="mt-1 text-2xl font-extrabold">Your vibe today ✨</p>
      </div>
      <div className="flex-1 space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-blush p-3">
            <p className="text-2xl font-extrabold text-pink">{products.length}</p>
            <p className="text-xs text-midnight/60">items loved</p>
          </div>
          <div className="rounded-2xl bg-lavender p-3">
            <p className="text-2xl font-extrabold text-grape">{best ? getInsight(best).dealScore : "—"}</p>
            <p className="text-xs text-midnight/60">best deal score</p>
          </div>
        </div>
        {top.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-midnight/50">You&apos;re into</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {top.map(([c]) => (
                <span key={c} className="chip">
                  {categoryById(c as Product["category"]).emoji} {categoryById(c as Product["category"]).name}
                </span>
              ))}
            </div>
          </div>
        )}
        {best && (
          <Link href={`/product/${best.slug}`} className="flex items-center gap-3 rounded-2xl border border-line p-2.5">
            <ProductImage product={best} className="h-12 w-12 rounded-xl" emojiSize="text-2xl" />
            <span className="min-w-0 text-sm">
              <span className="block truncate font-semibold">{best.name}</span>
              <span className="text-xs text-midnight/60">Best find · {peso(getInsight(best).bestOffer.price)}</span>
            </span>
          </Link>
        )}
      </div>
      <div className="grid gap-2 p-6 pt-0">
        {vibe ? (
          <button onClick={onAllVibes} className="btn-gradient">
            Swipe all vibes
          </button>
        ) : (
          <button onClick={onReset} className="btn-gradient">
            Start a fresh deck
          </button>
        )}
        <Link href="/saved" className="btn-ghost">
          See saved items
        </Link>
      </div>
    </motion.div>
  );
}
