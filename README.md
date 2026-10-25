# Lovioo — Swipe. Love. Shop.

A shopping discovery and deal-intelligence web app. Swipe through products, compare offers across Shopee, Lazada, TikTok Shop, Amazon and more, and get "buy now or wait" calls from Lovioo AI.

The app runs in two modes:

- **Supabase mode** (when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set): the catalog, offers and price history come from Supabase, shoppers get real accounts whose saves, alerts and swipes sync across devices, and the **Lovioo Business** admin lives at `/admin`.
- **Demo mode** (no env vars): a built-in mock catalog, accounts and data kept only in the browser, and `/admin` explains how to connect Supabase.

Product prices are illustrative seed data either way, and Lovioo AI is rule-based.

## Run it

```bash
npm install
cp .env.example .env.local   # Supabase mode; skip for demo mode
npm run dev                  # http://localhost:3000
```

`npm run build && npm start` for a production build. `npm run lint` checks the code.

## Supabase

The project is **lovioo** (`wjeadskkidggbznzmaeg`, Singapore). `.env.example` holds its URL and publishable key — both are safe in the browser; row level security protects the data.

- `supabase/migrations/` — schema: catalog (`categories`, `retailers`, `products`, `offers`, `price_history`), shopper data (`profiles`, `saved_items`, `price_alerts`, `swipes`), `product_events` analytics, the `admins` list, and the `admin_overview()` report. Every table has row level security.
- `supabase/seed.sql` — the starting catalog, generated from `lib/data` by `npx tsx scripts/generate-seed.ts`, with 90 days of illustrative price history.
- `supabase/admins.sql` — who can open `/admin`.

How the data flows:

- Pages read the published catalog on the server and refresh it at most once a minute, so admin edits show up on the shopper site within a minute.
- Changing an offer's price records today's price in `price_history` (database trigger). Deal scores and "buy now / wait" use the 90-day stats from that history.
- Turning a retailer off hides its offers from shoppers; unpublishing a product hides it.
- When a shopper signs in, anything they saved, alerted or swiped as a guest is merged into their account.

### Becoming an admin

1. Sign up in the app with an email listed in `public.admins` (`kevin@cleons.net` is there already) and confirm the email.
2. Open `/admin` — or Profile → "Open Lovioo Business".
3. Add teammates under **Admins**.

### Supabase dashboard settings to check

- **Authentication → URL configuration**: set the Site URL to the deployed address (e.g. your Vercel URL) and add it to the redirect URLs, so confirmation emails and Google sign-in return to the right site.
- **Authentication → Providers → Google**: needs a Google OAuth client before "Continue with Google" works.

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
| `/admin` | **Lovioo Business**: overview (KPIs, price trend by store, top categories and products), products (search, publish, edit details, media, vibes and per-store offers), retailer sources, deals & price alerts, categories, shoppers, admins |

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Zustand (persisted to `localStorage`) · Recharts · lucide-react · Poppins.

## Code map

- `lib/data/` — mock catalog (`products.ts`), retailers, categories and vibes
- `lib/insights.ts` — deterministic 90-day price history, deal score and buy/wait verdict
- `lib/recommend.ts` — taste scoring from onboarding prefs + swipes, swipe feed, similar items
- `lib/ai.ts` — scripted Lovioo AI (parses category, budget, brand, store, trending, gifts)
- `lib/store.ts` — user, preferences, saved items, alerts, swipes, streak, compare list
- `lib/data/catalog.ts`, `lib/data/load-catalog.ts` — maps Supabase rows to the app's types and loads the catalog on the server
- `lib/sync.ts`, `components/AuthSync.tsx` — signs shoppers in and keeps their data in step with Supabase
- `lib/supabase/` — client and generated database types
- `app/admin/`, `components/admin/` — the admin
- `components/swipe/` — swipe card, deck, match modal, confetti
- `components/product/` — product card, offers table, price chart, insight card, compare tray
- Brand tokens live in `tailwind.config.ts` (pink `#FF2D9A`, coral `#FF6B4A`, sunset `#FFB84D`, purple `#A855F7`, midnight `#0F2742`, cream `#FFF7F1`)

## Next steps

- Retailer feeds / affiliate APIs to update offers automatically (the price-history trigger is ready for it)
- Send push/email notifications when a price alert is reached (Deals & alerts shows who would be notified)
- Swap the scripted assistant for an LLM-backed one
- Image uploads to Supabase Storage instead of pasting image URLs
