"use client";

import { ExternalLink, Truck } from "lucide-react";
import { isPriced } from "@/lib/data/products";
import { offerHref, retailerById, storeSearchHref } from "@/lib/data/retailers";
import type { Product } from "@/lib/types";
import { getSupabase } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/sync";
import { cn, peso } from "@/lib/utils";
import { RetailerBadge } from "./RetailerBadge";

const DISCLOSURE = "Some store links are affiliate links: Lovioo may earn a small commission at no extra cost to you.";

export function OfferTable({ product }: { product: Product }) {
  if (!isPriced(product)) return <StoreLinks product={product} />;
  const offers = [...product.offers].sort((a, b) => a.price + a.shipping - (b.price + b.shipping));
  const bestTotal = offers[0].price + offers[0].shipping;

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-2">
        <p className="text-sm font-bold">
          Price list <span className="font-medium text-midnight/50">· {offers.length} store{offers.length > 1 ? "s" : ""}</span>
        </p>
        <p className="text-[11px] text-midnight/50">Sorted by total with shipping</p>
      </div>
      <ul className="space-y-2.5">
        {offers.map((o) => {
          const total = o.price + o.shipping;
          const best = total === bestTotal;
          const link = offerHref(o.retailer, o.url, product.name);
          const off = o.originalPrice > o.price ? Math.round((1 - o.price / o.originalPrice) * 100) : 0;
          return (
            <li
              key={o.retailer}
              className={cn("relative overflow-hidden rounded-2xl border bg-white p-4 transition", best ? "border-emerald-300 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.5)]" : "border-line")}
            >
              {best && <span className="absolute right-0 top-0 rounded-bl-2xl bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Best price</span>}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <span className="flex min-w-[9rem] flex-1 items-center gap-2">
                  <RetailerBadge id={o.retailer} size="sm" withName />
                </span>
                <span className="min-w-[7rem]">
                  <span className="flex items-baseline gap-2">
                    <span className="text-lg font-extrabold">{peso(o.price)}</span>
                    {off > 0 && <span className="text-xs text-midnight/40 line-through">{peso(o.originalPrice)}</span>}
                    {off > 0 && <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">-{off}%</span>}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-midnight/60">
                    <Truck className="h-3.5 w-3.5" /> {o.shipping ? `+ ${peso(o.shipping)} shipping` : "Free shipping"}
                    <span className={cn("ml-1 font-medium", o.inStock ? "text-emerald-600" : "text-coral")}>· {o.inStock ? "In stock" : "Out of stock"}</span>
                  </span>
                </span>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={() => trackEvent(getSupabase(), product.id, "click_out", o.retailer)}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-[0.97] sm:w-auto",
                    o.inStock ? (best ? "bg-brand text-white shadow-pop" : "bg-pink text-white") : "bg-line text-midnight/50",
                  )}
                >
                  {link.isSearch ? "Search store" : "isAffiliate" in link ? `Shop on ${retailerById(o.retailer).name}` : "View at retailer"} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-midnight/45">{DISCLOSURE}</p>
    </div>
  );
}

/** "See prices" picks: no tracked price, so just send shoppers to each store to compare live listings. */
function StoreLinks({ product }: { product: Product }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white">
      <p className="border-b border-line bg-blush/50 px-5 py-3 text-sm text-midnight/70">
        We don&apos;t track this pick&apos;s price yet. Compare sellers, prices and reviews on the store.
      </p>
      <ul>
        {product.offers.map((o) => {
          const link = offerHref(o.retailer, o.url, product.name);
          const search = link.isSearch ? undefined : storeSearchHref(o.retailer, product.name);
          return (
            <li key={o.retailer} className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-5 py-4 last:border-0">
              <span className="flex flex-col gap-1">
                <RetailerBadge id={o.retailer} size="sm" withName />
                {search && (
                  <a
                    href={search}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent(getSupabase(), product.id, "click_out", o.retailer)}
                    className="text-xs font-medium text-midnight/50 underline-offset-2 hover:text-pink hover:underline"
                  >
                    or search “{product.name}”
                  </a>
                )}
              </span>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => trackEvent(getSupabase(), product.id, "click_out", o.retailer)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-pink px-4 py-2 text-sm font-semibold text-white sm:w-auto"
              >
                {link.isSearch ? `Search ${retailerById(o.retailer).name}` : `Shop on ${retailerById(o.retailer).name}`} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-line/70 px-5 py-3 text-[11px] text-midnight/45">{DISCLOSURE}</p>
    </div>
  );
}
