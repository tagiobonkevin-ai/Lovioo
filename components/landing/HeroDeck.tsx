"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DiscountBadge } from "@/components/product/DealScore";
import { ProductImage } from "@/components/product/ProductImage";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { PRODUCTS, bestOffer, discountPct, isPriced } from "@/lib/data/products";
import { peso } from "@/lib/utils";

const FEATURED = ["sony-wh-1000xm5-wireless-headphones", "nike-air-force-1-07", "laneige-water-sleeping-mask", "fujifilm-instax-mini-12", "pop-mart-labubu-blind-box", "nintendo-switch-oled"];

// Read at render time: the catalog may have been swapped in from Supabase after this module loaded.
function heroPicks() {
  const picks = FEATURED.map((s) => PRODUCTS.find((p) => p.slug === s)).filter((p): p is (typeof PRODUCTS)[number] => !!p);
  return picks.length >= 3 ? picks : PRODUCTS.filter(isPriced).slice(0, 6);
}

/** Self-playing swipe demo for the landing hero. */
export function HeroDeck() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  useEffect(() => {
    const t = setInterval(() => {
      setDir(Math.random() > 0.3 ? 1 : -1);
      setI((n) => n + 1);
    }, 2400);
    return () => clearInterval(t);
  }, []);
  const [picks] = useState(heroPicks);
  if (picks.length === 0) return null;
  const cards = [0, 1, 2].map((k) => picks[(i + k) % picks.length]);

  return (
    <div className="relative mx-auto h-[440px] w-full max-w-sm sm:h-[500px]">
      <motion.div className="absolute -left-4 top-10 z-20 rounded-2xl bg-white px-3 py-2 text-xs font-semibold shadow-soft sm:-left-12" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
        💸 One tap to compare 4+ stores
      </motion.div>
      <motion.div className="absolute -right-2 bottom-24 z-20 rounded-2xl bg-white px-3 py-2 text-xs font-semibold shadow-soft sm:-right-10" animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 5 }}>
        ✨ AI: buy now or wait?
      </motion.div>
      <AnimatePresence initial={false} custom={dir}>
        {cards
          .map((p, k) => (
            <motion.div
              key={`${p.id}-${i + k}`}
              custom={dir}
              className="absolute inset-x-6 top-0 h-[380px] overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-black/5 sm:h-[430px]"
              style={{ zIndex: 10 - k }}
              initial={{ scale: 0.85, y: 40, opacity: 0 }}
              animate={{ scale: 1 - k * 0.05, y: k * 16, opacity: 1, rotate: 0, x: 0 }}
              variants={{ out: (d: number) => ({ x: d * 420, rotate: d * 18, opacity: 0, transition: { duration: 0.45 } }) }}
              exit="out"
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <ProductImage product={p} className="h-full w-full" emojiSize="text-[8rem]" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-midnight/90 to-transparent p-5 pt-16 text-white">
                <p className="text-lg font-bold leading-tight">{p.name}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xl font-extrabold">{isPriced(p) ? peso(bestOffer(p).price) : "See prices"}</span>
                  <DiscountBadge pct={discountPct(p)} />
                  <RetailerBadge id={bestOffer(p).retailer} size="xs" className="ml-auto" />
                </div>
              </div>
            </motion.div>
          ))
          .reverse()}
      </AnimatePresence>
      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center gap-5">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-coral shadow-soft">
          <X className="h-7 w-7" strokeWidth={3} />
        </span>
        <motion.span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-pop" animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
          <Heart className="h-7 w-7 fill-white" />
        </motion.span>
      </div>
    </div>
  );
}
