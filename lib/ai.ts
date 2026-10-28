import { AI_STRINGS, verdictText, type AiLang } from "@/lib/ai-i18n";
import { CATEGORIES } from "@/lib/data/categories";
import { BRANDS, PRODUCTS, isPriced, lowestPrice } from "@/lib/data/products";
import { ALL_RETAILERS, retailerById } from "@/lib/data/retailers";
import { getInsight } from "@/lib/insights";
import type { CategoryId, Product, RetailerId } from "@/lib/types";
import { peso } from "@/lib/utils";

export interface AiReply {
  text: string;
  products: Product[];
  followUps: string[];
}

// English, Tagalog and Visayan words are all understood whatever reply language is picked, so Taglish works too.
const CATEGORY_WORDS: Record<CategoryId, string[]> = {
  electronics: [
    "electronic", "gadget", "tech", "headphone", "earbud", "earphone", "speaker", "phone", "cellphone", "selpon", "telepono", "watch", "relo", "camera",
    "gaming", "console", "keyboard", "mouse", "tablet", "powerbank", "power bank", "charger", "cable",
  ],
  fashion: [
    "fashion", "sneaker", "shoe", "kicks", "bag", "dress", "hoodie", "jeans", "outfit", "clothes", "sunglasses", "shirt", "pants", "sandal",
    "sapatos", "tsinelas", "sinelas", "damit", "sinina", "bestida", "pantalon", "palda",
  ],
  beauty: [
    "beauty", "skincare", "skin", "makeup", "serum", "sunscreen", "glow", "fragrance", "perfume", "hair", "lip", "lotion", "pimple",
    "pabango", "pampaganda", "pampagwapa", "kolorete", "buhok", "tagihawat",
  ],
  home: [
    "home", "living", "decor", "furniture", "chair", "lamp", "kitchen", "coffee", "candle", "plant", "bedding", "vacuum", "storage", "curtain",
    "bahay", "balay", "kusina", "unan", "kurtina", "kama", "panglinis", "panlimpyo",
  ],
  sports: ["sport", "fitness", "gym", "run", "running", "yoga", "badminton", "outdoor", "camping", "workout", "pickleball", "paddle", "ehersisyo", "takbo", "dagan"],
  toys: ["toy", "lego", "plush", "collectible", "game", "puzzle", "drone", "hobby", "labubu", "laruan", "dulaan", "laro", "dula"],
  family: [
    "family", "baby", "diaper", "pet", "dog", "cat", "kid",
    "pamilya", "sanggol", "lampin", "anak", "alaga", "binuhi", "aso", "pusa", "iro", "iring", "lolo", "lola",
  ],
};

/** Tagalog/Visayan item words mapped to the English words product names and tags use. */
const ITEM_WORDS = new Map<string, string[]>(Object.entries({
  sapatos: ["sneaker", "shoe", "sandal", "footwear"],
  tsinelas: ["sandal", "slide", "slipper"],
  sinelas: ["sandal", "slide", "slipper"],
  damit: ["dress", "shirt", "tee", "hoodie", "clothing"],
  sinina: ["dress", "shirt", "tee", "hoodie", "clothing"],
  bestida: ["dress"],
  pantalon: ["jeans", "pants", "trousers"],
  pabango: ["fragrance", "perfume", "parfum"],
  cellphone: ["phone"],
  selpon: ["phone"],
  telepono: ["phone"],
  relo: ["watch"],
  laruan: ["toy", "plush", "collectible", "lego"],
  dulaan: ["toy", "plush", "collectible", "lego"],
  unan: ["bedding", "pillow"],
  kurtina: ["curtain"],
  kusina: ["kitchen"],
  lampin: ["diaper"],
  aso: ["dog", "pet"],
  iro: ["dog", "pet"],
  pusa: ["cat", "pet"],
  iring: ["cat", "pet"],
  buhok: ["hair"],
  tagihawat: ["pimple", "acne"],
}));

const GIFT_WORDS = ["gift", "regalo", "birthday", "present", "christmas", "anniversary", "pasalubong", "pangregalo", "iregalo"];

// Whole words plus plurals and the Tagalog "-ng" linker ("pabangong"), so "bag" doesn't match "bagong".
const hasWord = (q: string, w: string) => new RegExp(`\\b${w}(?:s|es|ng)?\\b`).test(q);

function parseBudget(q: string): number | null {
  const m = q.match(
    /(?:under|below|less than|<|max|budget(?: of| ko| nako)?|ubos sa|mas mura sa|kulang sa|hanggang|di lalagpas sa|dili molapas sa)\s*(?:php|₱|p)?\s*([\d,.]+)\s*(k)?/i,
  );
  if (!m) return null;
  let n = parseFloat(m[1].replace(/,/g, ""));
  if (m[2]) n *= 1000;
  return Number.isFinite(n) ? n : null;
}

/** Category name the way the AI says it, e.g. "gamit sa bahay". */
function categoryLabel(c: CategoryId, lang: AiLang) {
  return AI_STRINGS[lang].categories[c] ?? (CATEGORIES.find((x) => x.id === c)?.name ?? c).toLowerCase();
}

/** "Should I buy now or wait?" in any of the three languages. */
export const isBuyOrWait = (q: string) => /buy now or wait|should i buy|buy or wait|bilhin (ko )?na ba|hintayin|paliton na ba|hulaton/i.test(q);

/**
 * Answers a shopping question from the catalogue. `pool` defaults to the full catalogue; the front page passes the
 * public deals instead, so guests get a real answer before they have an account.
 */
export function askLovioo(input: string, name = "there", lang: AiLang = "en", catalogue: Product[] = PRODUCTS): AiReply {
  const s = AI_STRINGS[lang];
  const q = input.toLowerCase();
  const budget = parseBudget(q);
  const cats = (Object.keys(CATEGORY_WORDS) as CategoryId[]).filter((c) => CATEGORY_WORDS[c].some((w) => hasWord(q, w)));
  const brands = catalogue === PRODUCTS ? BRANDS : Array.from(new Set(catalogue.map((p) => p.brand)));
  const brand = brands.find((b) => q.includes(b.toLowerCase()));
  const retailer = ALL_RETAILERS.find(
    (r: RetailerId) => q.includes(retailerById(r).name.toLowerCase()) || (r === "tiktok" && q.includes("tiktok")),
  );
  const wantsTrending = /trend|viral|hot|popular|\buso\b|sikat|patok/.test(q);
  const wantsDeals = /deal|sale|discount|cheap|best price|promo|\bmura|barato|diskwento|tipid/.test(q);
  const wantsGift = GIFT_WORDS.some((w) => q.includes(w));
  const keywords = q
    .split(/\W+/)
    .flatMap((w) => ITEM_WORDS.get(w) ?? ITEM_WORDS.get(w.replace(/ng$/, "")) ?? (w.length > 3 ? [w] : []));

  const greeting = /^(hi|hello|hey|yo|uy|kumusta|kamusta|musta|maayong (buntag|hapon|gabii)|magandang (umaga|hapon|gabi))\b/.test(q.trim());
  if (greeting && q.trim().split(/\s+/).length <= 4) {
    return { text: s.greeting(name), products: [], followUps: s.greetingChips };
  }

  let pool = catalogue.filter((p) => {
    if (cats.length && !cats.includes(p.category)) return false;
    if (brand && p.brand !== brand) return false;
    if (retailer && !p.offers.some((o) => o.retailer === retailer)) return false;
    // A budget can only rule out a product whose price we track. An unpriced pick still belongs in the answer
    // -- the shopper taps through for the store's live price -- and dropping it here left suggested prompts
    // like "Skincare under P1,000" answering "couldn't find a match" whenever nothing was priced yet.
    if (budget && isPriced(p) && lowestPrice(p) > budget) return false;
    if (wantsGift && !p.tags.includes("gift idea") && !cats.length) return false;
    return true;
  });

  // Narrow by keyword overlap when the category is broad (e.g. "sneakers" within fashion).
  // Matches word starts, so "phone" finds "Phones" but not "headphones".
  const kwMatches = pool.filter((p) =>
    keywords.some((k) => {
      const re = new RegExp(`\\b${k.replace(/s$/, "")}`);
      return [p.name, p.subcategory, ...p.tags].some((f) => re.test(f.toLowerCase()));
    }),
  );
  if (kwMatches.length >= 1) pool = kwMatches;

  pool = pool
    .map((p) => ({ p, i: getInsight(p) }))
    .sort((a, b) => {
      if (wantsTrending) return Number(!!b.p.trending) - Number(!!a.p.trending) || b.i.dealScore - a.i.dealScore;
      return b.i.dealScore - a.i.dealScore;
    })
    .map((x) => x.p);

  const picks = pool.slice(0, 4);
  if (!picks.length) {
    return { text: s.noMatch(budget ? peso(budget) : null), products: [], followUps: s.noMatchChips };
  }

  const top = picks[0];
  const ti = getInsight(top);
  const catLabel = cats.length ? categoryLabel(cats[0], lang) : s.picks;
  // Only claim a budget was applied when at least one pick has a price to apply it to.
  const anyPriced = picks.some((p) => getInsight(p).priced);
  const budgetLabel = budget && anyPriced ? peso(budget) : null;
  const parts = [
    wantsTrending ? s.trending : wantsGift ? s.gifts : s.found(pool.length, catLabel, budgetLabel),
    ti.priced
      ? s.topPick(top.name, peso(ti.bestOffer.price), retailerById(ti.bestOffer.retailer).name, ti.dealScore, verdictText(ti, lang))
      : s.topPickSeePrices(top.name, verdictText(ti, lang)),
  ];
  if (budget && !anyPriced) parts.push(s.budgetUnpriced(peso(budget)));
  if (wantsDeals && ti.savings > 0) parts.push(s.savings(peso(ti.savings)));

  return {
    text: parts.join(" "),
    products: picks,
    followUps: [
      budget ? s.cheaper(peso(Math.round(budget / 2))) : s.under2k(cats.length ? catLabel : "skincare"),
      s.buyOrWait,
      s.trendingTikTok,
    ],
  };
}

export function buyOrWait(products: Product[], lang: AiLang = "en"): AiReply {
  const s = AI_STRINGS[lang];
  if (!products.length) return askLovioo("best deals", undefined, lang);
  const lines = products.slice(0, 3).map((p) => {
    const i = getInsight(p);
    const icon = !i.priced ? "🛍️" : i.verdict === "buy" ? "✅" : i.verdict === "good" ? "👌" : i.verdict === "new" ? "🆕" : "⏳";
    return i.priced ? `${icon} ${p.name}: ${verdictText(i, lang).toLowerCase()} (${s.score} ${i.dealScore}).` : `${icon} ${p.name}: ${verdictText(i, lang)}.`;
  });
  return {
    text: `${s.readIntro}\n${lines.join("\n")}\n${s.readTip}`,
    products: [],
    followUps: s.greetingChips,
  };
}
