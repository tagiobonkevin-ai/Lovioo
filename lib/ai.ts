import { CATEGORIES } from "@/lib/data/categories";
import { BRANDS, PRODUCTS, lowestPrice } from "@/lib/data/products";
import { RETAILERS } from "@/lib/data/retailers";
import { getInsight } from "@/lib/insights";
import type { CategoryId, Product, RetailerId } from "@/lib/types";
import { peso } from "@/lib/utils";

export interface AiReply {
  text: string;
  products: Product[];
  followUps: string[];
}

const CATEGORY_WORDS: Record<CategoryId, string[]> = {
  electronics: ["electronic", "gadget", "tech", "headphone", "earbud", "speaker", "phone", "watch", "camera", "gaming", "console", "keyboard", "mouse", "tablet"],
  fashion: ["fashion", "sneaker", "shoe", "kicks", "bag", "dress", "hoodie", "jeans", "outfit", "clothes", "sunglasses"],
  beauty: ["beauty", "skincare", "skin", "makeup", "serum", "sunscreen", "glow", "fragrance", "perfume", "hair"],
  home: ["home", "living", "decor", "furniture", "chair", "lamp", "kitchen", "coffee", "candle", "plant", "bedding", "vacuum"],
  sports: ["sport", "fitness", "gym", "run", "yoga", "badminton", "outdoor", "camping", "workout"],
  toys: ["toy", "lego", "plush", "collectible", "game", "puzzle", "drone", "hobby", "labubu"],
};

const GIFT_WORDS = ["gift", "regalo", "birthday", "present", "christmas", "anniversary"];

function parseBudget(q: string): number | null {
  const m = q.match(/(?:under|below|less than|<|max|budget(?: of)?)\s*(?:php|₱|p)?\s*([\d,.]+)\s*(k)?/i);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/,/g, ""));
  if (m[2]) n *= 1000;
  return Number.isFinite(n) ? n : null;
}

export function askLovioo(input: string, name = "there"): AiReply {
  const q = input.toLowerCase();
  const budget = parseBudget(q);
  const cats = (Object.keys(CATEGORY_WORDS) as CategoryId[]).filter((c) =>
    CATEGORY_WORDS[c].some((w) => q.includes(w)),
  );
  const brand = BRANDS.find((b) => q.includes(b.toLowerCase()));
  const retailer = (Object.keys(RETAILERS) as RetailerId[]).find(
    (r) => q.includes(RETAILERS[r].name.toLowerCase()) || (r === "tiktok" && q.includes("tiktok")),
  );
  const wantsTrending = /trend|viral|hot|popular/.test(q);
  const wantsDeals = /deal|sale|discount|cheap|best price|promo/.test(q);
  const wantsGift = GIFT_WORDS.some((w) => q.includes(w));
  const keywords = q.split(/\W+/).filter((w) => w.length > 3);

  if (/^(hi|hello|hey|yo|kumusta)\b/.test(q.trim()) && q.trim().split(/\s+/).length <= 3) {
    return {
      text: `Hey ${name}! 💖 Tell me what you're shopping for — a category, a budget, a vibe — and I'll dig up the best deals across Shopee, Lazada, TikTok Shop and more.`,
      products: [],
      followUps: ["Best deals on sneakers", "Skincare under ₱1,000", "Gift ideas under ₱2,000"],
    };
  }

  let pool = PRODUCTS.filter((p) => {
    if (cats.length && !cats.includes(p.category)) return false;
    if (brand && p.brand !== brand) return false;
    if (retailer && !p.offers.some((o) => o.retailer === retailer)) return false;
    if (budget && lowestPrice(p) > budget) return false;
    if (wantsGift && !p.tags.includes("gift idea") && !cats.length) return false;
    return true;
  });

  // Narrow by keyword overlap when the category is broad (e.g. "sneakers" within fashion).
  const kwMatches = pool.filter((p) =>
    keywords.some((k) =>
      [p.name, p.subcategory, ...p.tags].some((f) => f.toLowerCase().includes(k.replace(/s$/, ""))),
    ),
  );
  if (kwMatches.length >= 2) pool = kwMatches;

  pool = pool
    .map((p) => ({ p, i: getInsight(p) }))
    .sort((a, b) => {
      if (wantsTrending) return Number(!!b.p.trending) - Number(!!a.p.trending) || b.i.dealScore - a.i.dealScore;
      return b.i.dealScore - a.i.dealScore;
    })
    .map((x) => x.p);

  const picks = pool.slice(0, 4);
  if (!picks.length) {
    return {
      text: `Hmm, I couldn't find a match${budget ? ` under ${peso(budget)}` : ""}. Want me to widen the search or try another category?`,
      products: [],
      followUps: ["Show trending deals", "Home essentials", "Gift ideas under ₱2,000"],
    };
  }

  const top = picks[0];
  const ti = getInsight(top);
  const catLabel = cats.length ? CATEGORIES.find((c) => c.id === cats[0])!.name.toLowerCase() : "picks";
  const parts = [
    wantsTrending ? `Here's what's trending right now 🔥` : wantsGift ? `Gift-worthy finds 🎁` : `Found ${pool.length} ${catLabel}${budget ? ` under ${peso(budget)}` : ""} for you ✨`,
    `My top pick is **${top.name}** — ${peso(ti.bestOffer.price)} on ${RETAILERS[ti.bestOffer.retailer].name}, deal score ${ti.dealScore}/100. ${ti.headline}.`,
  ];
  if (wantsDeals && ti.savings > 0) parts.push(`That's ${peso(ti.savings)} off the list price.`);

  return {
    text: parts.join(" "),
    products: picks,
    followUps: [
      budget ? `Under ${peso(Math.round(budget / 2))} instead` : `${catLabel === "picks" ? "Skincare" : catLabel[0].toUpperCase() + catLabel.slice(1)} under ₱2,000`,
      "Should I buy now or wait?",
      "Trending on TikTok Shop",
    ],
  };
}

export function buyOrWait(products: Product[]): AiReply {
  if (!products.length) return askLovioo("best deals");
  const lines = products.slice(0, 3).map((p) => {
    const i = getInsight(p);
    const icon = i.verdict === "buy" ? "✅" : i.verdict === "good" ? "👌" : "⏳";
    return `${icon} ${p.name}: ${i.headline.toLowerCase()} (score ${i.dealScore}).`;
  });
  return {
    text: `Here's my read on those:\n${lines.join("\n")}\nTip: heart anything marked ⏳ and turn on a price alert — I'll ping you when it drops.`,
    products: [],
    followUps: ["Best deals on sneakers", "Home essentials", "Gift ideas under ₱2,000"],
  };
}
