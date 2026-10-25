"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ProductImage } from "@/components/product/ProductImage";
import { retailerById } from "@/lib/data/retailers";
import { getInsight } from "@/lib/insights";
import type { Product } from "@/lib/types";
import { peso } from "@/lib/utils";
import { Confetti } from "./Confetti";

export function MatchModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const i = getInsight(product);
  return (
    <>
      <Confetti />
      <motion.div
        className="fixed inset-0 z-[60] grid place-items-center bg-midnight/60 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="It's a match"
      >
        <motion.div
          className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-white text-center shadow-2xl"
          initial={{ scale: 0.6, rotate: -6 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-brand px-6 pb-16 pt-7 text-white">
            <motion.p className="text-4xl font-extrabold italic" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
              It&apos;s a Match! 💘
            </motion.p>
            <p className="mt-1 text-sm text-white/90">You loved it — and it&apos;s a top deal right now.</p>
          </div>
          <div className="-mt-12 px-6 pb-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25, type: "spring" }}>
              <ProductImage product={product} className="mx-auto h-28 w-28 rounded-3xl shadow-xl ring-4 ring-white" emojiSize="text-5xl" />
            </motion.div>
            <p className="mt-3 font-bold">{product.name}</p>
            <p className="mt-1 text-sm text-midnight/60">
              {peso(i.bestOffer.price)} on {retailerById(i.bestOffer.retailer).name} · deal score <b className="text-emerald-600">{i.dealScore}</b>
            </p>
            <div className="mt-5 grid gap-2">
              <Link href={`/product/${product.slug}`} className="btn-gradient w-full">
                Grab the deal
              </Link>
              <button onClick={onClose} className="btn-ghost w-full">
                Keep swiping
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
