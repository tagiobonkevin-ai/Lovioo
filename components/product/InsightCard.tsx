import { Sparkles } from "lucide-react";
import { retailerById } from "@/lib/data/retailers";
import { getInsight } from "@/lib/insights";
import type { Product } from "@/lib/types";
import { peso } from "@/lib/utils";
import { DealScoreRing, scoreColor } from "./DealScore";

export function InsightCard({ product }: { product: Product }) {
  const i = getInsight(product);
  return (
    <div className="rounded-3xl bg-gradient-to-br from-grape/10 via-pink/5 to-sunset/10 p-5 ring-1 ring-grape/10">
      <div className="flex items-start gap-4">
        {i.priced ? (
          <DealScoreRing score={i.dealScore} size={64} />
        ) : (
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white text-3xl shadow-sm">🛍️</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-grape">
            <Sparkles className="h-3.5 w-3.5" /> Lovioo AI insight
          </p>
          <p className="mt-1 text-lg font-bold" style={{ color: i.priced ? scoreColor(i.dealScore) : "#A855F7" }}>
            {i.headline}
          </p>
          <p className="mt-1 text-sm text-ink/70">{i.reason}</p>
          {i.priced && (
            <p className="mt-2 text-xs text-ink/60">
              Best offer: <b>{retailerById(i.bestOffer.retailer).name}</b> at {peso(i.bestOffer.price)}
              {i.bestOffer.shipping ? ` + ${peso(i.bestOffer.shipping)} shipping` : " with free shipping"}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
