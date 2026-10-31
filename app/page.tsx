import { ArrowRight, Check, Heart, ShoppingBag, Tag, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { CrushStories } from "@/components/crush/CrushStories";
import { DealSummary, GuestChat } from "@/components/landing/GuestChat";
import { HomeHeader } from "@/components/landing/HomeHeader";
import { HomeProductCard } from "@/components/landing/HomeProductCard";
import { LifestyleMosaic, LifestyleRibbon } from "@/components/landing/LifestyleRibbon";
import { PhotoCollage } from "@/components/landing/PhotoCollage";
import { SwipeDemo, type SwipeDemoItem } from "@/components/landing/SwipeDemo";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { browseCategories, categoryArt } from "@/lib/data/categories";
import { crushBySlug, crushProducts, crushStories } from "@/lib/data/crush";
import { loadCatalog, loadCollections, loadDeals, loadTeaser } from "@/lib/data/load-catalog";
import { dealsAsProducts } from "@/lib/data/public-deals";
import { isPriced, lowestPrice } from "@/lib/data/products";
import { MAIN_RETAILERS, retailerById } from "@/lib/data/retailers";
import { CONTACT_EMAIL } from "@/lib/site";
import type { Product } from "@/lib/types";
import { cn, peso } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Lovioo Philippines | Discover Products You'll Love",
  description:
    "Discover gadgets, fashion, beauty and lifestyle products with Lovioo. Swipe, explore, ask AI and compare available offers from supported online stores in the Philippines.",
  openGraph: {
    title: "Lovioo — Your Next Favourite Find Starts Here.",
    description: "Discover. Swipe. Fall in Love. Products from stores across the Philippines, all in one place.",
  },
};

/** Small pink uppercase label above each section. */
const Eyebrow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn("flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-pink", className)}>
    <span className="h-1.5 w-1.5 rounded-full bg-pink" aria-hidden />
    {children}
  </p>
);

/** Section heading at daydream's type: serif, weight 500. The second line, when given, is the brand pink. */
const Heading = ({ children, accent, className }: { children: React.ReactNode; accent?: React.ReactNode; className?: string }) => (
  <h2 className={cn("mt-2 font-display text-[28px] font-medium leading-[1.2] tracking-[-0.012em] text-ink sm:text-[36px]", className)}>
    {children}
    {accent && <span className="block text-pink">{accent}</span>}
  </h2>
);

const pill = "inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-bold transition active:scale-[0.98]";
const pinkPill = cn(pill, "bg-pink text-white shadow-pop hover:brightness-105");
const whitePill = cn(pill, "bg-white text-ink ring-1 ring-ink/10 hover:ring-ink/25");
const section = "mx-auto max-w-[1248px] px-4 lg:px-6";

/** The home page's Brand Crush row: the brief's six collections, each fronted by one of its own product photos. */
const CRUSH_ROW = [
  { slug: "gadget-crush", fallback: "electronics" },
  { slug: "style-crush", fallback: "fashion" },
  { slug: "beauty-crush", fallback: "beauty" },
  { slug: "home-crush", fallback: "home" },
  { slug: "daily-crush", fallback: "essentials" },
  { slug: "budget-crush", fallback: "baby-kids" },
];

const AI_PROMPTS = [
  "Find wireless earbuds under ₱2,000.",
  "Find a birthday gift for my girlfriend.",
  "Show me fashionable sneakers under ₱3,000.",
  "Find affordable skincare products.",
  "Show me popular gadgets.",
  "Find products for my home office.",
];

const TREND_CHIPS = [
  { label: "Trending Finds", href: "/crush/trend-crush" },
  { label: "New Arrivals", href: "/search?sort=new" },
  { label: "Hidden Gems", href: "/crush/hidden-crush" },
  { label: "Worth a Look", href: "/crush/daily-crush" },
  { label: "Under ₱500", href: "/search?max=500" },
  { label: "Under ₱1,000", href: "/search?max=1000" },
];

const HERO_FEATURES = [
  { icon: Zap, title: "Smart Discovery", body: "Products you'll love" },
  { icon: Tag, title: "Compare Prices", body: "See the best deals" },
  { icon: Heart, title: "Save Favourites", body: "Build your wishlist" },
  { icon: ShoppingBag, title: "Shop Smarter", body: "Go to your preferred store" },
];

const SWIPE_POINTS = ["Swipe right to save.", "Swipe left to skip.", "Tap to view product information.", "Add to your wishlist.", "View available offers."];

/** One product for the price-discovery section: the verified product with the most store offers. */
const comparePick = (products: Product[]) =>
  [...products].filter((p) => isPriced(p) && p.offers.length).sort((a, b) => b.offers.length - a.offers.length || lowestPrice(a) - lowestPrice(b))[0];

const updated = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }) : null;

/**
 * The Lovioo home page: a brand-led discovery experience. Every product, price and collection on it comes from the
 * live catalogue; sections without real data stay out of the way rather than show placeholders.
 */
export default async function Landing() {
  const [, deals, curated] = await Promise.all([loadCatalog(), loadDeals(), loadCollections()]);
  // Guests see today's public deals (the full catalogue is for members); with no verified prices yet, names and photos.
  const teasers = deals.length ? [] : (await loadTeaser()).slice(0, 12);
  const products = dealsAsProducts(deals);
  // Admin -> Collections: the first published "Today's Finds" collection with products leads that section; without
  // one, today's public deals fill it as before.
  const todays = curated.find((c) => c.inTodaysFinds && c.products.length);
  const trending = (todays?.products ?? products).slice(0, 8);
  const brandRow = curated.filter((c) => c.inBrandCrush);
  const swipeItems: SwipeDemoItem[] = products
    .filter((p) => p.image?.trim())
    .slice(0, 8)
    .map((p) => ({ id: p.id, slug: p.slug, name: p.name, brand: p.brand, image: p.image, emoji: p.emoji, price: isPriced(p) ? lowestPrice(p) : undefined }));
  const compare = comparePick(products);
  const stories = crushStories(products, curated);
  const categories = browseCategories((id) => products.some((p) => p.category === id));

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-ui text-ink antialiased">
      {/* 01 — Hero: Lovioo AI front and centre, the way daydream opens with its chat */}
      <div className="relative isolate overflow-hidden bg-white">
        <HomeHeader />
        <section className={cn(section, "relative pb-10 pt-8 lg:pb-14 lg:pt-14")}>
          <div className="mx-auto max-w-[760px] text-center">
            <h1 className="sr-only">Find Something You&apos;ll Love</h1>
            <p className="mx-auto mt-0 max-w-[46ch] text-[16px] leading-relaxed text-ink/65">
              Shop every store in the Philippines through one chat. Tell Lovioo what you want, your budget and what you love — in English, Tagalog
              or Visayan.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-[760px]">
            <GuestChat deals={deals} teasers={teasers} starters={AI_PROMPTS.slice(0, 4)} />
          </div>
          <div className="mx-auto mt-6 max-w-[720px] text-center">
            <DealSummary deals={deals} teasers={teasers} />
          </div>
          <ul className="mx-auto mt-12 grid max-w-[880px] grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            {HERO_FEATURES.map((f) => (
              <li key={f.title} className="flex min-w-0 items-start gap-2.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink-soft text-pink" aria-hidden>
                  <f.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold leading-tight">{f.title}</span>
                  <span className="block text-[12px] leading-snug text-ink/55">{f.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <LifestyleRibbon className="pb-14 lg:pb-20" />
      </div>

      {/* Stores Lovioo links to (names only; no logos or partnership claims) */}
      <section className="border-y border-ink/5 bg-white">
        <div className={cn(section, "flex flex-wrap items-center gap-x-8 gap-y-3 py-5")}>
          <p className="rounded-full bg-surface px-4 py-2 text-[12px] font-semibold text-ink/60">Shop at stores across the Philippines</p>
          {MAIN_RETAILERS.map((r) => (
            <span key={r} className="text-[17px] font-extrabold tracking-[-0.02em]" style={{ color: retailerById(r).color }}>
              {retailerById(r).name}
            </span>
          ))}
        </div>
      </section>

      {/* Crush Stories: the collections as tap-through stories */}
      {stories.length > 0 && (
        <section className={cn(section, "pt-10")}>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-[22px] font-medium">Crush Stories</h2>
            <span className="text-[12px] font-semibold text-ink/50">Tap a story to start</span>
          </div>
          <CrushStories stories={stories} className="mt-4" />
        </section>
      )}

      {/* 02 — Brand Crush */}
      <section className={cn(section, "py-20 lg:py-28")}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[640px]">
            <Eyebrow>Brand Crush</Eyebrow>
            <Heading accent="Just Hit Different.">Some Finds</Heading>
            <p className="mt-4 text-[16px] leading-relaxed text-ink/60">
              Meet your next favourite things. Discover products that catch your eye, make life easier, elevate your style or simply make you smile.
            </p>
          </div>
          <Link href="/crush" className={pinkPill}>
            Explore Your Next Crush <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 mt-10 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
          {(brandRow.length
            ? brandRow.map((c) => ({ slug: c.id, title: c.title, tagline: c.tagline, emoji: c.emoji, art: c.cover || c.products.find((p) => p.image)?.image }))
            : CRUSH_ROW.map(({ slug, fallback }) => {
                const c = crushBySlug(slug)!;
                const art = crushProducts(c, undefined, products).find((p) => p.image)?.image || categoryArt(fallback)?.image;
                return { slug, title: c.title, tagline: c.tagline, emoji: c.emoji, art };
              })
          ).map(({ slug, title, tagline, emoji, art }) => {
            return (
              <Link key={slug} href={`/crush/${slug}`} className="group relative block aspect-[4/5] w-[78vw] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-[2rem] bg-pink-soft lg:aspect-[4/3] lg:w-auto lg:max-w-none">
                {art ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={art} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-7xl" aria-hidden>
                    {emoji}
                  </span>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/15 to-transparent" aria-hidden />
                <span className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
                    Members&apos; collection
                  </span>
                  <span className="mt-1 block font-display text-[26px] font-medium leading-tight">{title}</span>
                  <span className="mt-1 block text-[14px] text-white/85">{tagline}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 04 — Categories */}
      <section className={cn(section, "py-20 lg:py-28")}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[640px]">
            <Eyebrow>Categories</Eyebrow>
            <Heading accent="A Lot to Love.">A Little Bit of Everything.</Heading>
            <p className="mt-4 text-[16px] leading-relaxed text-ink/60">Explore the categories you love, and discover something you didn&apos;t know you needed.</p>
          </div>
          <Link href="/discover" className={whitePill}>
            Explore All Categories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 mt-10 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-8 lg:overflow-visible lg:px-0">
          {categories.map((c) => {
            const art = categoryArt(c.id);
            return (
              <Link
                key={c.id}
                href={`/search?category=${c.id}`}
                className="group flex w-[168px] shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-ink/[0.06] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(255,79,184,0.6)] lg:w-auto"
              >
                <span className="block aspect-[4/3] overflow-hidden bg-pink-soft">
                  {art ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={art.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
                  ) : (
                    <span className="grid h-full place-items-center text-4xl" aria-hidden>
                      {c.emoji}
                    </span>
                  )}
                </span>
                <span className="flex flex-1 items-end justify-between gap-2 p-3.5">
                  <span className="min-w-0">
                    <span className="block font-display text-[16px] font-medium leading-tight">{c.name}</span>
                    {art && <span className="mt-1 block text-[11px] leading-snug text-ink/55">{art.tagline}</span>}
                  </span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-ink/60 transition group-hover:bg-pink group-hover:text-white" aria-hidden>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 05 — Trending Crush */}
      {!!trending.length && (
        <section className="border-y border-ink/5 bg-white">
          <div className={cn(section, "py-20 lg:py-28")}>
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="min-w-0">
                <Eyebrow>{todays ? todays.eyebrow || todays.title : "Prices today"}</Eyebrow>
                <Heading accent={todays ? todays.tagline || undefined : "Loving It Already."}>{todays ? todays.title : "Today's Finds."}</Heading>
                <p className="mt-4 max-w-[48ch] text-[16px] leading-relaxed text-ink/60">
                  {todays?.description ||
                    "A taste of today's finds with verified prices. Join free to see the whole catalogue — trending picks, new arrivals and hidden gems."}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {TREND_CHIPS.map((c) => (
                    <Link key={c.label} href={c.href} className="rounded-full bg-white px-4 py-2 text-[13px] font-bold text-ink/75 ring-1 ring-ink/10 transition hover:bg-pink hover:text-white hover:ring-pink">
                      {c.label}
                    </Link>
                  ))}
                </div>
                <Link href="/crush/trend-crush" className={cn(pinkPill, "mt-8")}>
                  See What&apos;s Trending <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <PhotoCollage
                items={trending.filter((p) => p.image).map((p) => ({ href: `/product/${p.slug}`, image: p.image, label: p.brand }))}
                stickers={["Today 🔥", "Worth a look 💘"]}
              />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {trending.map((p) => (
                <HomeProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 06 — Swipe */}
      <section className={cn(section, "grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28")}>
        <div className="min-w-0">
          <Eyebrow>Signature feature</Eyebrow>
          <Heading accent="Something You Love.">Swipe Your Way to</Heading>
          <p className="mt-4 max-w-[48ch] text-[16px] leading-relaxed text-ink/60">
            Shopping discovery should be fun, effortless and completely yours. No endless searching. No complicated browsing. Just discover products,
            swipe through your favourites and save the ones you love.
          </p>
          <ul className="mt-6 grid gap-3">
            {SWIPE_POINTS.map((s) => (
              <li key={s} className="flex items-center gap-3 text-[15px] font-semibold">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pink-soft text-pink" aria-hidden>
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
                {s}
              </li>
            ))}
          </ul>
          <Link href="/swipe" className={cn(pinkPill, "mt-8")}>
            Start Swiping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {swipeItems.length > 0 && (
          <div className="rounded-[2.5rem] bg-white px-6 py-10 shadow-[0_24px_60px_-34px_rgba(255,79,184,0.55)] ring-1 ring-ink/[0.06]">
            <p className="mb-6 text-center text-[13px] font-bold text-ink/55">Try it — drag the card, or tap ✕ / ♥</p>
            <SwipeDemo items={swipeItems} />
          </div>
        )}
      </section>

      {/* 07 — Price discovery */}
      <section className="border-y border-ink/5 bg-white">
        <div className={cn(section, "grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28")}>
          <div>
            <Eyebrow>Explore your options</Eyebrow>
            <Heading accent="Explore the Options.">Love the Product.</Heading>
            <p className="mt-4 max-w-[48ch] text-[16px] leading-relaxed text-ink/65">
              Found something you love? Explore available offers from supported stores — Shopee, Lazada, TikTok Shop and more — before deciding where
              to shop.
            </p>
            <Link href="/search?sort=discount" className={cn(pinkPill, "mt-8")}>
              Explore Available Deals <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-4 text-[12px] text-ink/50">Product availability, pricing and offers are subject to retailer updates.</p>
          </div>
          {compare ? (
            <div className="rounded-[2rem] bg-white p-5 shadow-[0_24px_60px_-30px_rgba(255,79,184,0.5)] ring-1 ring-ink/[0.06] sm:p-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl" style={{ background: "radial-gradient(circle at 30% 20%, #fff 0%, #FFE8F1 75%)" }}>
                  {compare.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={compare.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center text-3xl">{compare.emoji}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/45">{compare.brand}</p>
                  <p className="line-clamp-2 text-[15px] font-bold leading-snug">{compare.name}</p>
                </div>
              </div>
              <ul className="mt-5 divide-y divide-ink/5">
                {[...compare.offers]
                  .sort((a, b) => a.price - b.price)
                  .map((o, i) => (
                    <li key={o.retailer} className="flex items-center justify-between gap-3 py-3">
                      <span className="min-w-0">
                        <span className="block text-[15px] font-bold">{retailerById(o.retailer).name}</span>
                        <span className="block text-[12px] text-ink/50">{updated(o.updatedAt) ? `Updated ${updated(o.updatedAt)}` : o.inStock ? "In stock" : "Check stock"}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className={cn("text-[17px] font-extrabold", i === 0 && "text-pink")}>{peso(o.price)}</span>
                        <Link href={`/product/${compare.slug}`} className="rounded-full bg-pink px-3.5 py-1.5 text-[12px] font-bold text-white">
                          View
                        </Link>
                      </span>
                    </li>
                  ))}
              </ul>
              {compare.offers.length === 1 && <p className="mt-2 text-[12px] text-ink/50">More stores appear here as they&apos;re added for this product.</p>}
            </div>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {["shopee", "lazada", "tiktok"].map((r) => (
                <li key={r} className="rounded-full bg-white px-5 py-3 text-[15px] font-bold ring-1 ring-ink/10">
                  {retailerById(r as never).name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 08 — Wishlist */}
      <section className={cn(section, "py-20 text-center lg:py-28")}>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-pink-soft text-pink" aria-hidden>
          <Heart className="h-7 w-7 fill-pink" />
        </span>
        <Heading className="mx-auto mt-5" accent="Save It.">If You Love It,</Heading>
        <p className="mx-auto mt-4 max-w-[46ch] text-[16px] leading-relaxed text-ink/60">
          Because not every great find needs to be bought today. Save the products you love, build your own wishlist and come back whenever you&apos;re
          ready.
        </p>
        <Link href="/saved" className={cn(pinkPill, "mt-8")}>
          Build My Wishlist <Heart className="h-4 w-4" />
        </Link>
      </section>

      {/* 09 — Brand statement */}
      <section className="bg-white px-4 py-20 text-center lg:py-28">
        <p className="mx-auto max-w-[20ch] font-display text-[34px] font-medium leading-[1.2] tracking-[-0.012em] sm:text-[48px]">
          The Best Finds Aren&apos;t Always the Ones You Search For.
        </p>
        <p className="mx-auto mt-4 max-w-[22ch] font-display text-[26px] font-medium italic leading-tight text-pink sm:text-[36px]">
          Sometimes, They&apos;re the Ones You Discover.
        </p>
        <p className="mx-auto mt-6 max-w-[48ch] text-[16px] leading-relaxed text-ink/60">
          That&apos;s the Lovioo experience. A little inspiration, a little curiosity and a whole lot of things to love.
        </p>
        <LifestyleMosaic className="mx-auto mt-10 max-w-[880px]" />
        <p className="mt-8 text-[13px] font-bold uppercase tracking-[0.2em] text-pink">Discover your next something.</p>
      </section>

      {/* 10 — Final call */}
      <section className="px-4 py-16 lg:px-6 lg:py-24">
        <div className="relative isolate mx-auto max-w-[1248px] overflow-hidden rounded-[2.5rem] bg-brand px-6 py-16 text-center text-white sm:px-12 lg:py-24">
          <h2 className="mx-auto max-w-[18ch] font-display text-[32px] font-medium leading-[1.2] tracking-[-0.012em] sm:text-[44px]">Ready to Find Something You Love?</h2>
          <p className="mx-auto mt-4 max-w-[46ch] text-[17px] leading-relaxed text-white/90">
            Your next favourite gadget, outfit, beauty find or everyday essential could be just one discovery away. Make your next scroll a little more
            exciting.
          </p>
          <Link href="/auth?next=/discover" className={cn(pill, "mt-9 bg-white text-ink hover:brightness-95")}>
            Join Lovioo — It&apos;s Time to Discover <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-[1248px] flex-col items-center gap-4 px-4 py-10 sm:flex-row sm:justify-between lg:px-6">
          <Logo tagline />
          <LegalLinks />
        </div>
        <div className="mx-auto max-w-[1248px] space-y-1 px-4 pb-10 text-center text-[12px] leading-[1.6] text-ink/45 sm:text-left lg:px-6">
          <p>Lovioo may earn a commission from qualifying purchases made through eligible retailer links, at no additional cost to customers.</p>
          <p>Lovioo is a discovery platform: purchases are completed on each retailer&apos;s own site. Prices and availability are set by each retailer and may change.</p>
          <p>
            Questions? <span className="font-semibold text-ink/60">{CONTACT_EMAIL}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
