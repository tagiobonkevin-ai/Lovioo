"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHydrated } from "@/components/Providers";
import { productById } from "@/lib/data/products";
import { useLovioo } from "@/lib/store";
import type { Product } from "@/lib/types";
import { ProductImage } from "./ProductImage";

export function CompareTray() {
  const hydrated = useHydrated();
  const ids = useLovioo((s) => s.compare);
  const toggle = useLovioo((s) => s.toggleCompare);
  const clear = useLovioo((s) => s.clearCompare);
  const items = ids.map(productById).filter(Boolean) as Product[];
  const pathname = usePathname();
  const show = hydrated && items.length > 0 && pathname !== "/ai" && !pathname.startsWith("/compare");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-3xl bg-midnight p-3 text-white shadow-2xl md:bottom-6"
        >
          <div className="flex flex-1 gap-2">
            {items.map((p) => (
              <div key={p.id} className="relative">
                <ProductImage product={p} className="h-12 w-12 rounded-xl" emojiSize="text-2xl" />
                <button onClick={() => toggle(p.id)} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white text-midnight" aria-label={`Remove ${p.name}`}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {Array.from({ length: 3 - items.length }).map((_, i) => (
              <div key={i} className="grid h-12 w-12 place-items-center rounded-xl border border-dashed border-white/30 text-xs text-white/40">
                +
              </div>
            ))}
          </div>
          <button onClick={clear} className="text-xs text-white/60 hover:text-white">
            Clear
          </button>
          <Link href={`/compare?ids=${ids.join(",")}`} className="btn-gradient !px-4 !py-2">
            Compare {items.length}
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
