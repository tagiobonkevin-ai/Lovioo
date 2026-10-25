# Lovioo — Swipe. Love. Shop.

A shopping discovery and deal-intelligence web app. Swipe through products, compare offers across Shopee, Lazada, TikTok Shop, Amazon and more, and get "buy now or wait" calls from Lovioo AI.

> Illustrative concept: the catalog, prices, price history and AI replies are mock data generated in the browser. Nothing is sent to a server.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

`npm run build && npm start` for a production build. `npm run lint` checks the code.

## What's inside

| Route | What it does |
| --- | --- |
| `/` | Landing page with a self-playing swipe demo, categories, features, supported stores |
| `/auth` | Sign up / sign in (demo — any valid email + 6-char password, or "Continue with Google") |
| `/onboarding` | Interests, budget and favourite stores — feeds the recommendations |
| `/discover` | Home: top-deal carousel, recommended for you, trending deals |
| `/swipe` | **Swipe to discover** — drag right to love, left to pass, up to super-love (saves + price alert); tap to flip for every store's offer; undo; vibe filters; daily goal and streak; "It's a Match!" confetti on top deals; end-of-deck recap. The deck re-ranks itself from what you love. Keyboard: ← → ↑, Space to flip, Z to undo |
| `/search` | Category and search results with filters (category, price, store, brand, rating, on sale), sorting and a compare tray |
| `/product/[slug]` | Gallery, AI insight with deal score, offers table, 30/90-day price history (lowest price or per store), similar items |
| `/compare/[slug]` | All offers for one product, price history, product info |
| `/compare?ids=a,b,c` | Side-by-side comparison of up to 3 products with a "Lovioo pick" |
| `/saved` | Saved items (with collections) and price alerts with target prices |
| `/ai` | Lovioo AI chat (also available as a slide-over from the "Ask Lovioo AI" button) |
| `/profile` | Interests, budget, favourite stores, notification toggles, sign out |

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Zustand (persisted to `localStorage`) · Recharts · lucide-react · Poppins.

## Code map

- `lib/data/` — mock catalog (`products.ts`), retailers, categories and vibes
- `lib/insights.ts` — deterministic 90-day price history, deal score and buy/wait verdict
- `lib/recommend.ts` — taste scoring from onboarding prefs + swipes, swipe feed, similar items
- `lib/ai.ts` — scripted Lovioo AI (parses category, budget, brand, store, trending, gifts)
- `lib/store.ts` — user, preferences, saved items, alerts, swipes, streak, compare list
- `components/swipe/` — swipe card, deck, match modal, confetti
- `components/product/` — product card, offers table, price chart, insight card, compare tray
- Brand tokens live in `tailwind.config.ts` (pink `#FF2D9A`, coral `#FF6B4A`, sunset `#FFB84D`, purple `#A855F7`, midnight `#0F2742`, cream `#FFF7F1`)

## Next steps

- Real auth and database (e.g. Supabase) for accounts, saves and alerts
- Retailer feeds / affiliate APIs for live offers and real price history
- Swap the scripted assistant for an LLM-backed one
- Push/email notifications for price-drop alerts
