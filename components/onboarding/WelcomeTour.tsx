"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, Sparkles, Tag, X, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useHydrated } from "@/components/Providers";
import { useMemberCatalog } from "@/lib/data/member-catalog";
import { PRODUCTS } from "@/lib/data/products";
import { useLovioo } from "@/lib/store";
import { cn } from "@/lib/utils";

const SEEN_KEY = "lovioo-welcome-seen";

const SCREENS = [
  {
    title: ["Discover", "Products Like", "Never Before"],
    body: "Gadgets, fashion, beauty and everyday finds from stores across the Philippines — in one place.",
    pills: [
      { icon: Zap, label: "Smart Discovery" },
      { icon: Tag, label: "Compare Prices" },
      { icon: Heart, label: "Save Favourites" },
    ],
  },
  {
    title: ["Swipe.", "Love.", "Shop."],
    body: "Swipe right to save what you love, left to skip. Your feed learns what feels like you.",
    pills: [
      { icon: Heart, label: "Swipe right to save" },
      { icon: X, label: "Swipe left to skip" },
    ],
  },
  {
    title: ["Just Ask.", "Lovioo", "Finds."],
    body: "Tell Lovioo what you need and your budget — in English, Tagalog or Visayan.",
    pills: [
      { icon: Sparkles, label: "Earbuds under ₱2,000" },
      { icon: Sparkles, label: "Gift for my girlfriend" },
    ],
  },
] as const;

/**
 * Three welcome screens for a first-time visitor: deep pink, one big product photo with floating feature pills, and
 * Skip / back / next. Shown once per device, to guests only (new accounts get the questionnaire instead).
 */
export function WelcomeTour() {
  const hydrated = useHydrated();
  const user = useLovioo((s) => s.user);
  const ready = useMemberCatalog((s) => s.status) === "ready";
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);

  useEffect(() => {
    if (!hydrated || user || !ready) return;
    try {
      if (!localStorage.getItem(SEEN_KEY)) setOpen(true);
    } catch {
      /* storage blocked: skip the tour */
    }
  }, [hydrated, user, ready]);

  const photos = useMemo(() => (ready ? PRODUCTS.filter((p) => p.image?.trim()).map((p) => p.image) : []), [ready]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* fine */
    }
  };

  if (!open) return null;
  const screen = SCREENS[at];
  const last = at === SCREENS.length - 1;
  const photo = photos.length ? photos[at % photos.length] : null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Welcome to Lovioo" className="fixed inset-0 z-[90] grid place-items-center bg-ink/60 backdrop-blur-sm sm:p-6">
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#E8358F] via-pink to-[#FF8A9F] text-white sm:h-[min(800px,92vh)] sm:max-w-[420px] sm:rounded-[2.5rem]">
        <button onClick={close} className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold backdrop-blur">
          Skip
        </button>

        <AnimatePresence mode="wait">
          <motion.div key={at} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="absolute inset-0">
            {/* Big product photo with floating pills, after the headphone onboarding shot */}
            <div className="absolute inset-x-0 top-0 h-[58%]">
              <div className="absolute left-1/2 top-[14%] h-[78%] w-[78%] -translate-x-1/2 rotate-[-6deg] overflow-hidden rounded-[2.5rem] bg-white/20 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)] ring-4 ring-white/30">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-8xl" aria-hidden>
                    💘
                  </span>
                )}
              </div>
              {screen.pills.map((p, i) => (
                <span
                  key={p.label}
                  className="absolute left-[8%] inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3.5 py-2 text-[13px] font-semibold backdrop-blur-md"
                  style={{ top: `${30 + i * 15}%`, transform: `rotate(${-14 + i * 5}deg)` }}
                >
                  <p.icon className="h-4 w-4" aria-hidden /> {p.label}
                </span>
              ))}
            </div>

            <div className="absolute inset-x-0 bottom-[7.5rem] px-7">
              <h2 className="font-display text-[42px] font-medium leading-[1.05]">
                {screen.title.map((line, i) => (
                  <span key={line} className={cn("block", i === 2 && "italic")}>
                    {line}
                  </span>
                ))}
              </h2>
              <p className="mt-3 max-w-[32ch] text-[14px] leading-relaxed text-white/85">{screen.body}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => setAt((a) => Math.max(0, a - 1))}
            disabled={at === 0}
            aria-label="Back"
            className="grid h-14 w-14 place-items-center rounded-[1.25rem] bg-white/20 backdrop-blur transition disabled:opacity-30"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex gap-1.5" aria-hidden>
            {SCREENS.map((_, i) => (
              <span key={i} className={cn("h-2 rounded-full transition-all", i === at ? "w-5 bg-white" : "w-2 bg-white/45")} />
            ))}
          </div>
          {last ? (
            <button onClick={close} className="h-14 rounded-[1.25rem] bg-white px-5 text-[15px] font-bold text-pink">
              Start Discovering
            </button>
          ) : (
            <button onClick={() => setAt((a) => a + 1)} aria-label="Next" className="grid h-14 w-14 place-items-center rounded-[1.25rem] bg-white text-pink">
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
