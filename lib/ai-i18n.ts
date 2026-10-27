import type { CategoryId, Insight } from "@/lib/types";

/** Languages Lovioo AI can reply in. "ceb" is Visayan (Cebuano). */
export type AiLang = "en" | "tl" | "ceb";

export const AI_LANGS: { id: AiLang; label: string; short: string }[] = [
  { id: "en", label: "English", short: "EN" },
  { id: "tl", label: "Tagalog", short: "TL" },
  { id: "ceb", label: "Visayan", short: "VIS" },
];

type Verdict = Insight["verdict"] | "seePrices";

interface AiStrings {
  hi: (name: string) => string;
  intro: string;
  placeholder: string;
  starters: string[];
  greeting: (name: string) => string;
  greetingChips: string[];
  noMatch: (budget: string | null) => string;
  noMatchChips: string[];
  /** Front page before any price is verified: we can name the products, but not quote a price. */
  teaserFound: (n: number) => string;
  teaserNone: string;
  trending: string;
  gifts: string;
  found: (n: number, what: string, budget: string | null) => string;
  topPick: (name: string, price: string, store: string, score: number, verdict: string) => string;
  topPickSeePrices: (name: string, verdict: string) => string;
  savings: (amount: string) => string;
  cheaper: (amount: string) => string;
  under2k: (what: string) => string;
  buyOrWait: string;
  trendingTikTok: string;
  readIntro: string;
  readTip: string;
  score: string;
  picks: string;
  verdicts: Record<Verdict, string>;
  categories: Partial<Record<CategoryId, string>>;
}

export const AI_STRINGS: Record<AiLang, AiStrings> = {
  en: {
    hi: (name) => `Hi ${name}! 👋`,
    intro: "What are you looking for today? I compare prices across stores and tell you when to buy.",
    placeholder: "Ask Lovioo AI anything…",
    starters: ["Best deals on sneakers", "Skincare under ₱1,000", "Home essentials", "Trending on TikTok Shop", "Gift ideas under ₱2,000"],
    greeting: (name) =>
      `Hey ${name}! 💖 Tell me what you're shopping for — a category, a budget, a vibe — and I'll dig up the best deals across Shopee, Lazada, TikTok Shop and more.`,
    greetingChips: ["Best deals on sneakers", "Skincare under ₱1,000", "Gift ideas under ₱2,000"],
    noMatch: (budget) => `Hmm, I couldn't find a match${budget ? ` under ${budget}` : ""}. Want me to widen the search or try another category?`,
    noMatchChips: ["Show trending deals", "Home essentials", "Gift ideas under ₱2,000"],
    teaserFound: (n) => `Here ${n === 1 ? "is" : "are"} ${n} ${n === 1 ? "pick" : "picks"} from the Lovioo catalogue. Prices are for members, so join free and I'll compare every store for you ✨`,
    teaserNone: "I couldn't match that to a pick on the front page. Join free and I'll search the whole catalogue with live prices ✨",
    trending: "Here's what's trending right now 🔥",
    gifts: "Gift-worthy finds 🎁",
    found: (n, what, budget) => `Found ${n} ${what}${budget ? ` under ${budget}` : ""} for you ✨`,
    topPick: (name, price, store, score, verdict) => `My top pick is **${name}** — ${price} on ${store}, deal score ${score}/100. ${verdict}.`,
    topPickSeePrices: (name, verdict) => `My top pick is **${name}**, a popular one. ${verdict} — tap it to compare sellers.`,
    savings: (amount) => `That's ${amount} off the list price.`,
    cheaper: (amount) => `Under ${amount} instead`,
    under2k: (what) => `${what[0].toUpperCase() + what.slice(1)} under ₱2,000`,
    buyOrWait: "Should I buy now or wait?",
    trendingTikTok: "Trending on TikTok Shop",
    readIntro: "Here's my read on those:",
    readTip: "Tip: heart anything marked ⏳ and turn on a price alert — I'll ping you when it drops.",
    score: "score",
    picks: "picks",
    verdicts: {
      buy: "Buy now — great deal",
      good: "Fair price",
      wait: "Wait for a drop",
      new: "Price tracking just started",
      seePrices: "Live prices on Shopee & Lazada",
    },
    categories: {},
  },
  tl: {
    hi: (name) => `Hi ${name}! 👋`,
    intro: "Ano'ng hinahanap mo ngayon? Ikukumpara ko ang presyo sa iba't ibang store at sasabihin ko kung kailan ang best time bumili.",
    placeholder: "Magtanong kay Lovioo AI…",
    starters: ["Murang sapatos", "Skincare na mas mura sa ₱1,000", "Gamit sa bahay", "Uso sa TikTok Shop", "Regalo na mas mura sa ₱2,000"],
    greeting: (name) =>
      `Hi ${name}! 💖 Sabihin mo lang kung ano'ng hinahanap mo — category, budget, o vibe — at hahanapan kita ng best deals sa Shopee, Lazada, TikTok Shop at iba pa.`,
    greetingChips: ["Murang sapatos", "Skincare na mas mura sa ₱1,000", "Regalo na mas mura sa ₱2,000"],
    noMatch: (budget) => `Hala, wala akong nahanap${budget ? ` na mas mura sa ${budget}` : ""}. Palawakin ko ba ang search o subukan natin ang ibang category?`,
    noMatchChips: ["Ano'ng uso ngayon?", "Gamit sa bahay", "Regalo na mas mura sa ₱2,000"],
    teaserFound: (n) => `Heto ang ${n} pick mula sa catalogue ng Lovioo. Para sa mga member ang presyo, kaya sumali ka nang libre at ikukumpara ko ang lahat ng tindahan ✨`,
    teaserNone: "Wala akong na-match diyan sa mga pick sa front page. Sumali nang libre at hahanapin ko ang buong catalogue na may live na presyo ✨",
    trending: "Ito ang mga patok ngayon 🔥",
    gifts: "Mga swak na pangregalo 🎁",
    found: (n, what, budget) => `May ${n} ${what}${budget ? ` na mas mura sa ${budget}` : ""} akong nahanap para sa'yo ✨`,
    topPick: (name, price, store, score, verdict) => `Top pick ko ang **${name}** — ${price} sa ${store}, deal score ${score}/100. ${verdict}.`,
    topPickSeePrices: (name, verdict) => `Top pick ko ang **${name}**, sikat 'to. ${verdict} — i-tap para ikumpara ang mga seller.`,
    savings: (amount) => `Tipid ka ng ${amount} mula sa original na presyo.`,
    cheaper: (amount) => `Mas mura sa ${amount}`,
    under2k: (what) => `${what[0].toUpperCase() + what.slice(1)} na mas mura sa ₱2,000`,
    buyOrWait: "Bilhin ko na ba o hintayin?",
    trendingTikTok: "Uso sa TikTok Shop",
    readIntro: "Ito ang tingin ko sa mga 'yan:",
    readTip: "Tip: i-heart ang may ⏳ at i-on ang price alert — sasabihan kita pag bumaba ang presyo.",
    score: "score",
    picks: "items",
    verdicts: {
      buy: "Bilhin na — magandang deal",
      good: "Sakto ang presyo",
      wait: "Hintayin muna bumaba",
      new: "Kakasimula pa lang namin i-track ang presyo",
      seePrices: "Live ang presyo sa Shopee at Lazada",
    },
    categories: {
      electronics: "gadgets",
      fashion: "damit at sapatos",
      beauty: "pampaganda at skincare",
      home: "gamit sa bahay",
      sports: "pang-sports",
      toys: "laruan",
      family: "para sa pamilya at alaga",
    },
  },
  ceb: {
    hi: (name) => `Hi ${name}! 👋`,
    intro: "Unsa imong gipangita karon? Ikumpara nako ang presyo sa lain-laing store ug sultihan tika kanus-a maayo mopalit.",
    placeholder: "Pangutana kang Lovioo AI…",
    starters: ["Barato nga sapatos", "Skincare ubos sa ₱1,000", "Gamit sa balay", "Uso sa TikTok Shop", "Regalo ubos sa ₱2,000"],
    greeting: (name) =>
      `Hi ${name}! 💖 Sultihi lang ko unsa imong gipangita — category, budget, o vibe — ug pangitaan tika og best deals sa Shopee, Lazada, TikTok Shop ug uban pa.`,
    greetingChips: ["Barato nga sapatos", "Skincare ubos sa ₱1,000", "Regalo ubos sa ₱2,000"],
    noMatch: (budget) => `Hala, wala koy nakit-an${budget ? ` nga ubos sa ${budget}` : ""}. Palapdan nako ang search o sulayan nato ang laing category?`,
    noMatchChips: ["Unsay uso karon?", "Gamit sa balay", "Regalo ubos sa ₱2,000"],
    teaserFound: (n) => `Ania ang ${n} ka pick gikan sa catalogue sa Lovioo. Para sa mga member ang presyo, busa apil nga libre ug ikomparar nako ang tanang tindahan ✨`,
    teaserNone: "Wala koy na-match niana sa mga pick sa front page. Apil nga libre ug pangitaon nako ang tibuok catalogue nga may live nga presyo ✨",
    trending: "Mao ni ang uso karon 🔥",
    gifts: "Nindot nga iregalo 🎁",
    found: (n, what, budget) => `Naa koy ${n} ka ${what}${budget ? ` nga ubos sa ${budget}` : ""} para nimo ✨`,
    topPick: (name, price, store, score, verdict) => `Akong top pick ang **${name}** — ${price} sa ${store}, deal score ${score}/100. ${verdict}.`,
    topPickSeePrices: (name, verdict) => `Akong top pick ang **${name}**, sikat kaayo ni. ${verdict} — i-tap aron ikumpara ang mga seller.`,
    savings: (amount) => `Makadaginot ka og ${amount} gikan sa orihinal nga presyo.`,
    cheaper: (amount) => `Ubos sa ${amount}`,
    under2k: (what) => `${what[0].toUpperCase() + what.slice(1)} ubos sa ₱2,000`,
    buyOrWait: "Paliton na ba nako o hulaton?",
    trendingTikTok: "Uso sa TikTok Shop",
    readIntro: "Mao ni akong tan-aw ana:",
    readTip: "Tip: i-heart ang naay ⏳ ug i-on ang price alert — sultihan tika kung mobaba ang presyo.",
    score: "score",
    picks: "items",
    verdicts: {
      buy: "Palita na — nindot nga deal",
      good: "Sakto ra ang presyo",
      wait: "Hulata usa nga mobaba",
      new: "Bag-o pa lang namo gi-track ang presyo",
      seePrices: "Live ang presyo sa Shopee ug Lazada",
    },
    categories: {
      electronics: "gadgets",
      fashion: "sinina ug sapatos",
      beauty: "pampagwapa ug skincare",
      home: "gamit sa balay",
      sports: "pang-sports",
      toys: "dulaan",
      family: "para sa pamilya ug binuhi",
    },
  },
};

/** The AI's verdict line in the chosen language (insight headlines are English-only). */
export const verdictText = (i: Insight, lang: AiLang) => AI_STRINGS[lang].verdicts[i.priced ? i.verdict : "seePrices"];
