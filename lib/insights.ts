import { onCatalogChange } from "@/lib/data/catalog";
import { bestOffer, isPriced, lowestPrice } from "@/lib/data/products";
import { retailerById } from "@/lib/data/retailers";
import type { Insight, PricePoint, Product, RetailerId } from "@/lib/types";
import { hashString, peso, roundPrice, seeded } from "@/lib/utils";

// Fixed reference date so server and client render identical mock history.
const TODAY = Date.UTC(2026, 9, 25);
const DAY = 86_400_000;

const historyCache = new Map<string, PricePoint[]>();
const insightCache = new WeakMap<Product, Insight>();
onCatalogChange(() => historyCache.clear());

/** Demo mode: 90 days of illustrative lowest prices, ending at today's real lowest price. Supabase mode reads real history instead. */
export function priceHistory(p: Product, days = 90): PricePoint[] {
  const key = `${p.id}:${days}`;
  const cached = historyCache.get(key);
  if (cached) return cached;

  const rnd = seeded(hashString(p.slug + "history"));
  const now = lowestPrice(p);
  // Some products are at an all-time low, others recently spiked down or up.
  const level = now * (0.95 + rnd() * 0.3);
  const points: PricePoint[] = [];
  let price = level;
  for (let i = days - 1; i >= 0; i--) {
    if (i === 0) price = now;
    else {
      price += (level - price) * 0.15 + (rnd() - 0.5) * level * 0.05;
      if (rnd() < 0.04) price *= 0.85; // flash sale dip
    }
    const d = new Date(TODAY - i * DAY);
    points.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      price: i === 0 ? now : roundPrice(price),
    });
  }
  historyCache.set(key, points);
  return points;
}

/** Per-retailer history for the multi-line chart: each retailer tracks the overall trend with its own offset. */
export function retailerHistory(p: Product, days = 30) {
  const base = priceHistory(p, 90).slice(-days);
  return base.map((pt, idx) => {
    const row: Record<string, number | string> = { label: pt.label };
    p.offers.forEach((o) => {
      const rnd = seeded(hashString(p.slug + o.retailer + idx));
      const ratio = o.price / lowestPrice(p);
      row[o.retailer] = idx === base.length - 1 ? o.price : roundPrice(pt.price * ratio * (0.98 + rnd() * 0.05));
    });
    return row as { label: string } & Partial<Record<RetailerId, number>>;
  });
}

export function getInsight(p: Product): Insight {
  const cached = insightCache.get(p);
  if (cached) return cached;
  const insight = computeInsight(p);
  insightCache.set(p, insight);
  return insight;
}

/** Below this much real history, a buy/wait call would be a guess, so we say so instead. */
export const MIN_HISTORY_DAYS = 14;

function computeInsight(p: Product): Insight {
  if (!isPriced(p)) return seePricesInsight(p);
  if (p.stats && p.stats.days < MIN_HISTORY_DAYS) return earlyInsight(p, p.stats);
  let low: number, high: number, avg: number;
  if (p.stats) {
    ({ low90: low, high90: high, avg90: avg } = p.stats);
  } else {
    const prices = priceHistory(p).map((h) => h.price);
    low = Math.min(...prices);
    high = Math.max(...prices);
    avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  }
  const best = bestOffer(p);
  const now = best.price;

  // Position in the 90-day range (1 = at the low) blended with discount vs average.
  const range = Math.max(high - low, 1);
  const position = 1 - (now - low) / range;
  const vsAvg = Math.max(-0.3, Math.min(0.3, (avg - now) / avg));
  const ratingBoost = (p.rating - 4.2) * 10;
  const dealScore = Math.round(Math.max(8, Math.min(99, position * 60 + (vsAvg + 0.3) * 60 + ratingBoost)));

  let verdict: Insight["verdict"];
  let headline: string;
  let reason: string;
  if (dealScore >= 80) {
    verdict = "buy";
    headline = "Buy now — great deal";
    reason = `It's ${peso(avg - now)} below the 90-day average and close to the lowest price we've seen (${peso(low)}).`;
  } else if (dealScore >= 55) {
    verdict = "good";
    headline = "Fair price";
    reason = `Around the usual price. The 90-day low was ${peso(low)}; set an alert if you can wait.`;
  } else {
    verdict = "wait";
    headline = "Wait for a drop";
    reason = `Price is above its 90-day average of ${peso(avg)}. It's dropped to ${peso(low)} before — we'll ping you.`;
  }

  return {
    dealScore,
    verdict,
    headline,
    reason,
    priced: true,
    bestOffer: best,
    lowest90: low,
    avg90: Math.round(avg),
    savings: Math.max(0, Math.round(best.originalPrice - best.price)),
  };
}

function earlyInsight(p: Product, stats: NonNullable<Product["stats"]>): Insight {
  const best = bestOffer(p);
  const listedOff = best.originalPrice > best.price ? Math.round((1 - best.price / best.originalPrice) * 100) : 0;
  const days = Math.max(1, stats.days);
  return {
    // Neutral score: only the store's own "was" price to go on.
    dealScore: Math.min(75, 45 + Math.round(listedOff * 0.8)),
    verdict: "new",
    headline: "Price tracking just started",
    reason: `We've tracked this price for ${days} day${days === 1 ? "" : "s"}. ${
      listedOff ? `The store lists it ${listedOff}% off. ` : ""
    }Set a price alert and we'll tell you when it drops.`,
    priced: true,
    bestOffer: best,
    lowest90: stats.low90,
    avg90: stats.avg90,
    savings: Math.max(0, Math.round(best.originalPrice - best.price)),
  };
}

/** "See prices" picks: no tracked price, so no score or verdict, just a nudge to compare on the stores. */
function seePricesInsight(p: Product): Insight {
  const stores = p.offers.map((o) => retailerById(o.retailer).name);
  const where = stores.length > 1 ? `${stores.slice(0, -1).join(", ")} & ${stores[stores.length - 1]}` : stores[0] ?? "the store";
  return {
    dealScore: 0,
    verdict: "new",
    priced: false,
    headline: `Live prices on ${where}`,
    reason: "A popular pick we don't price-track yet. Tap through to compare sellers, prices and reviews on the store.",
    bestOffer: p.offers[0],
    lowest90: 0,
    avg90: 0,
    savings: 0,
  };
}
