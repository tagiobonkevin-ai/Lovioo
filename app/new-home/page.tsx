import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { DreamPrompt } from "@/components/landing/DreamPrompt";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { ProductImage } from "@/components/product/ProductImage";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { VIBES } from "@/lib/data/categories";
import { loadCatalog } from "@/lib/data/load-catalog";
import { PRODUCTS, isPriced, lowestPrice } from "@/lib/data/products";
import { MAIN_RETAILERS, retailerById } from "@/lib/data/retailers";
import type { Product } from "@/lib/types";
import { cn, peso } from "@/lib/utils";

// Preview of the editorial landing page; replaces "/" once approved.
export const metadata = { title: "Lovioo — Shop the way you talk", robots: { index: false } };

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });

const MOOD_ART: Record<string, string> = {
  cozy: "from-[#F6D9C6] via-[#F9E7DA] to-[#FDF4EC]",
  glowup: "from-[#FFD6EC] via-[#FBE3F0] to-[#FFF4F9]",
  gamer: "from-[#D9D3FF] via-[#E6E1FF] to-[#F4F2FF]",
  sporty: "from-[#CDEFE0] via-[#E0F6EC] to-[#F2FBF7]",
  street: "from-[#E4E1DA] via-[#EEECE6] to-[#F8F7F3]",
  workfromhome: "from-[#D6E8F7] via-[#E5F0FA] to-[#F4F9FD]",
};
const MOOD_LINE: Record<string, string> = {
  cozy: "Candles, blankets, slow Sundays",
  glowup: "Skincare, make-up, a little sparkle",
  gamer: "Headsets, keyboards, late-night ranked",
  sporty: "Gear for the 5am run",
  street: "Sneakers and fits that turn heads",
  workfromhome: "A desk you'll actually like",
};

const STEPS = [
  { n: "01", title: "Say it like you'd say it", body: "“Something for my sister's birthday, mga ₱1,000.” Lovioo AI understands budgets, moods and Taglish." },
  { n: "02", title: "Swipe what you love", body: "Love it or pass. Every swipe teaches your feed what feels like you." },
  { n: "03", title: "Shop the best price", body: "We compare Shopee, Lazada, TikTok Shop and Amazon, then send you to the store to check out." },
];

/** Products for the drifting rows: real photos first, then the rest as soft emoji tiles. */
function driftRows() {
  const withPhoto = PRODUCTS.filter((p) => p.image);
  const rest = PRODUCTS.filter((p) => !p.image);
  const picks = [...withPhoto, ...rest].slice(0, 20);
  return [picks.filter((_, i) => i % 2 === 0), picks.filter((_, i) => i % 2 === 1)];
}

function DriftCard({ product }: { product: Product }) {
  const priced = isPriced(product);
  return (
    <Link href={`/product/${product.slug}`} className="group block w-40 shrink-0 sm:w-48" tabIndex={-1}>
      <ProductImage product={product} className="aspect-[4/5] rounded-2xl transition duration-500 group-hover:scale-[1.02]" emojiSize="text-5xl" />
      <p className="mt-2 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-midnight/45">{product.brand}</p>
      <p className="truncate text-[13px] text-midnight/80">{product.name}</p>
      <p className="text-[13px] font-semibold text-midnight">{priced ? peso(lowestPrice(product)) : "See prices"}</p>
    </Link>
  );
}

function DriftRow({ products, reverse }: { products: Product[]; reverse?: boolean }) {
  if (!products.length) return null;
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className={cn("flex w-max gap-4 hover:[animation-play-state:paused] motion-reduce:animate-none", reverse ? "animate-drift-reverse" : "animate-drift")}>
        {[...products, ...products].map((p, i) => (
          <div key={`${p.id}-${i}`} aria-hidden={i >= products.length || undefined}>
            <DriftCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function NewHome() {
  await loadCatalog();
  const [rowA, rowB] = driftRows();
  const h = "font-[family-name:var(--font-serif)] font-normal tracking-[-0.01em]";

  return (
    <div className={cn(serif.variable, "min-h-screen overflow-x-hidden bg-[#FBF7F2] text-midnight")}>
      <header className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden gap-6 text-sm text-midnight/60 md:flex">
          <Link href="/discover" className="hover:text-midnight">Discover</Link>
          <Link href="/brands" className="hover:text-midnight">Brands</Link>
          <a href="#how" className="hover:text-midnight">How it works</a>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Link href="/auth?mode=signin" className="rounded-full px-4 py-2 text-sm text-midnight/70 hover:text-midnight">
            Sign in
          </Link>
          <Link href="/auth" className="rounded-full bg-midnight px-4 py-2 text-sm font-semibold text-white transition hover:bg-midnight/90">
            Join free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 pb-10 pt-12 text-center sm:pt-20">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-[28rem] w-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,45,154,0.12),transparent)]" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink">Your shopping daydreams, found</p>
          <h1 className={cn(h, "mt-5 text-[2.9rem] leading-[1.02] sm:text-7xl")}>
            Describe it. <em className="text-pink">Love it.</em>
            <br />
            We&apos;ll find the best price.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-midnight/60 sm:text-base">
            Tell Lovioo what you&apos;re after in your own words. We search Shopee, Lazada, TikTok Shop and more, and show you what&apos;s worth it.
          </p>
          <DreamPrompt className="mx-auto mt-8 max-w-2xl text-left" />
        </div>
      </section>

      {/* Drifting picks */}
      <section aria-label="Popular on Lovioo" className="space-y-5 py-8">
        <DriftRow products={rowA} />
        <DriftRow products={rowB} reverse />
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-16 sm:px-6 sm:py-24">
        <h2 className={cn(h, "max-w-2xl text-4xl leading-tight sm:text-5xl")}>
          Shopping that starts with <em>a feeling</em>, not a filter.
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t border-midnight/15 pt-5">
              <span className={cn(h, "text-3xl text-pink")}>{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-midnight/60">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Moods */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className={cn(h, "text-4xl sm:text-5xl")}>Shop by mood</h2>
          <Link href="/swipe" className="hidden items-center gap-1 text-sm font-semibold text-midnight/70 hover:text-pink sm:inline-flex">
            Start swiping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {VIBES.map((v, i) => (
            <Link
              key={v.id}
              href={`/swipe?vibe=${v.id}`}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-5 transition hover:-translate-y-0.5 sm:p-6",
                MOOD_ART[v.id],
                i === 0 ? "row-span-2 min-h-[18rem] lg:min-h-[22rem]" : "min-h-[8.5rem] lg:min-h-[10.5rem]",
                // The last mood fills its row as a wide banner instead of sitting alone.
                i === VIBES.length - 1 && "col-span-2 !min-h-[7.5rem] lg:col-span-3",
              )}
            >
              <span className={cn("transition duration-500 group-hover:scale-110 group-hover:rotate-6", i === 0 ? "text-7xl" : "text-4xl")} aria-hidden>
                {v.emoji}
              </span>
              <span>
                <span className={cn(h, "block leading-none", i === 0 ? "text-4xl" : "text-2xl sm:text-3xl")}>{v.label}</span>
                <span className="mt-1 block text-xs text-midnight/55">{MOOD_LINE[v.id]}</span>
              </span>
              <ArrowUpRight className="absolute right-4 top-4 h-5 w-5 text-midnight/30 transition group-hover:text-pink" />
            </Link>
          ))}
        </div>
      </section>

      {/* Every store */}
      <section className="border-y border-midnight/10 bg-white/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between sm:px-6">
          <p className={cn(h, "text-center text-2xl sm:text-left sm:text-3xl")}>
            Every store. <em>One</em> Lovioo.
          </p>
          <ul className="flex flex-wrap justify-center gap-5">
            {MAIN_RETAILERS.map((r) => (
              <li key={r} className="flex items-center gap-2 text-sm text-midnight/70">
                <RetailerBadge id={r} size="sm" /> {retailerById(r).name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing */}
      <section className="px-4 py-20 text-center sm:py-28">
        <h2 className={cn(h, "mx-auto max-w-3xl text-[2.6rem] leading-[1.05] sm:text-6xl")}>
          Your next favourite thing is <em className="text-pink">one sentence</em> away.
        </h2>
        <DreamPrompt className="mx-auto mt-8 max-w-xl text-left" chips={false} />
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/swipe" className="rounded-full bg-midnight px-5 py-2.5 font-semibold text-white hover:bg-midnight/90">
            Start swiping
          </Link>
          <Link href="/discover" className="rounded-full px-5 py-2.5 font-semibold text-midnight/70 ring-1 ring-midnight/15 hover:text-midnight">
            Browse deals
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl border-t border-midnight/10 px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo tagline />
          <LegalLinks />
        </div>
        <p className="mt-4 text-center text-[10px] text-midnight/35 sm:text-left">
          Some store links are affiliate links. Prices and availability are set by each retailer and may change.
        </p>
      </footer>
    </div>
  );
}
