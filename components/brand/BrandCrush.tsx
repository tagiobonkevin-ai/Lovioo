"use client";

import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { brandCrush, brandProducts, type Brand } from "@/lib/data/brands";
import { cn } from "@/lib/utils";
import { BrandAvatar } from "./BrandAvatar";

/** "Brand Crush" carousel: featured partner stores (or top brands until partners are featured). */
export function BrandCrush({ className }: { className?: string }) {
  const { featured, brands } = brandCrush(12);
  if (!brands.length) return null;
  return (
    <section className={className}>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-extrabold">Brand Crush 💘</h2>
          <p className="text-xs text-midnight/60">{featured ? "Featured partner stores — tap one to shop its picks" : "Top brands on Lovioo — tap one to see all its products"}</p>
        </div>
        <Link href="/brands" className="text-sm font-semibold text-pink">
          All brands
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {brands.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="snap-start">
            <BrandCard brand={b} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function BrandCard({ brand, className }: { brand: Brand; className?: string }) {
  const count = brandProducts(brand).length;
  return (
    <Link
      href={`/brand/${brand.id}`}
      className={cn("group relative flex h-44 w-40 shrink-0 flex-col justify-end overflow-hidden rounded-[1.75rem] p-3.5 text-white shadow-soft transition active:scale-[0.97]", className)}
      style={{ background: brand.cover ? undefined : `linear-gradient(150deg, ${brand.color} 0%, ${brand.color}cc 45%, #0F2742 140%)` }}
    >
      {brand.cover && <img src={brand.cover} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
      <span className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-midnight/10 to-transparent" />
      {brand.featured && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-pink">
          <BadgeCheck className="h-3 w-3" /> Partner
        </span>
      )}
      <span className="relative flex items-center gap-2">
        <BrandAvatar brand={brand} className="h-9 w-9 text-xs ring-2 ring-white/70" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold leading-tight">{brand.name}</span>
          <span className="flex items-center gap-1 text-[11px] text-white/80">
            {count} product{count === 1 ? "" : "s"} <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
          </span>
        </span>
      </span>
    </Link>
  );
}
