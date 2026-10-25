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
    <div className="overflow-hidden rounded-3xl border border-line bg-white">
      <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-4 border-b border-line bg-blush/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-midnight/50 sm:grid">
        <span>Retailer</span>
        <span>Price</span>
        <span>Shipping</span>
        <span>Availability</span>
        <span className="w-32 text-right">Action</span>
      </div>
      <ul>
        {offers.map((o) => {
          const total = o.price + o.shipping;
          const best = total === bestTotal;
          const link = offerHref(o.retailer, o.url, product.name);
          return (
            <li
              key={o.retailer}
              className={cn(
                "grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-line/70 px-5 py-4 last:border-0 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto]",
                best && "bg-emerald-50/50",
              )}
            >
              <span className="flex items-center gap-2">
                <RetailerBadge id={o.retailer} size="sm" withName />
                {best && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">BEST</span>}
              </span>
              <span className="text-right sm:text-left">
                <span className="block font-bold">{peso(o.price)}</span>
                {o.originalPrice > o.price && <span className="text-xs text-midnight/40 line-through">{peso(o.originalPrice)}</span>}
              </span>
              <span className="flex items-center gap-1 text-xs text-midnight/60 sm:text-sm">
                <Truck className="h-3.5 w-3.5" /> {o.shipping ? peso(o.shipping) : "Free shipping"}
              </span>
              <span className={cn("text-right text-xs font-medium sm:text-left sm:text-sm", o.inStock ? "text-emerald-600" : "text-coral")}>
                {o.inStock ? "In stock" : "Out of stock"}
              </span>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => trackEvent(getSupabase(), product.id, "click_out", o.retailer)}
                className={cn("col-span-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold sm:col-span-1 sm:w-32", o.inStock ? "bg-pink text-white" : "bg-line text-midnight/50")}
              >
                {link.isSearch ? "Search store" : "isAffiliate" in link ? `Shop on ${retailerById(o.retailer).name}` : "View at retailer"} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-line/70 px-5 py-3 text-[11px] text-midnight/45">{DISCLOSURE}</p>
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
