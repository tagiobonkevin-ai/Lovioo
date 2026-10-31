import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { display, ui } from "@/app/fonts";
import { Logo } from "@/components/brand/Logo";
import { DealCard } from "@/components/landing/DealCard";
import { CategoryCard } from "@/components/product/CategoryCard";
import { TeaserCard } from "@/components/landing/TeaserCard";
import { DealSummary, GuestChat } from "@/components/landing/GuestChat";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { HalloweenDecor, HalloweenNote } from "@/components/seasonal/Halloween";
import { brandById } from "@/lib/data/brands";
import { CATEGORIES } from "@/lib/data/categories";
import { loadCatalog, loadDeals, loadTeaser } from "@/lib/data/load-catalog";
import { brandDeals } from "@/lib/data/public-deals";
import { isHalloween } from "@/lib/season";
import { MAIN_RETAILERS, retailerById } from "@/lib/data/retailers";
import { cn } from "@/lib/utils";

export const revalidate = 300;

/** Small uppercase label above each section — the quiet signpost daydream uses. */
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/40">{children}</p>
);

const Heading = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h2 className={cn("mt-1 font-display text-[24px] font-medium leading-[1.5] tracking-[-0.009em] text-ink", className)}>{children}</h2>
);

/**
 * The front page: a calm, editorial shop window. Serif headings, small sans labels, white space, and the real
 * numbers people came for — today's discounts, with prices. The catalogue behind it needs an account.
 */
export default async function Landing() {
  const [, deals] = await Promise.all([loadCatalog(), loadDeals()]);
  const brandsOnSale = brandDeals(deals, 8);
  // Featured brands get picture cards; the rest stay in the "Best of sale" list, so no brand is listed twice.
  const featuredBrands = brandsOnSale.filter((b) => brandById(b.id)?.featured);
  const brands = brandsOnSale.filter((b) => !brandById(b.id)?.featured);
  const grid = deals.slice(0, 12);
  // Until a product has a verified price, we show it without one rather than quote a number we can't stand
  // behind. Entering real prices in Admin -> Price list brings the deal sections back on their own.
  const teasers = deals.length ? [] : (await loadTeaser()).slice(0, 12);

  return (
    <div className={cn(display.variable, ui.variable, "lovioo-paper min-h-screen overflow-x-hidden bg-white font-ui text-ink antialiased")}>
      <header className="mx-auto flex h-16 max-w-[1248px] items-center gap-6 px-4 lg:px-6">
        <Logo />
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link href="/auth?mode=signin" className="px-4 py-2 text-ink/60 transition hover:text-ink">
            Sign in
          </Link>
          <Link href="/auth?next=/swipe" className="bg-ink px-4 py-2 font-medium text-white transition hover:opacity-85">
            Join free
          </Link>
        </nav>
      </header>

      {/* Hero + Lovioo AI */}
      <section className="relative mx-auto max-w-[1248px] px-4 pb-16 pt-8 lg:px-6 lg:pb-24 lg:pt-16">
        <HalloweenDecor />
        <div className="mx-auto max-w-[760px] text-center">
          <HalloweenNote className="mb-3" />
          <h1 className="font-display text-[42px] font-medium leading-[1.43] tracking-[-0.012em] text-ink sm:text-[52px] lg:text-[56px] lg:leading-[1.357] lg:tracking-[-0.015em]">
            Shop every store in the Philippines through one chat.
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-[15px] leading-relaxed text-ink/60">
            Tell Lovioo AI what you want in English, Tagalog or Visayan. We compare Shopee, Lazada, TikTok Shop and Amazon and show you
            what&apos;s actually worth it.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-[720px]">
          <GuestChat deals={deals} teasers={teasers} />
        </div>
        <div className="mx-auto mt-8 max-w-[720px] text-center">
          <DealSummary deals={deals} teasers={teasers} />
        </div>
      </section>

      {/* Featured brands: chosen in Admin -> Brands, shown with one of their product photos */}
      {!!featuredBrands.length && (
        <section className="mx-auto max-w-[1248px] px-4 pb-16 lg:px-6 lg:pb-24">
          <Eyebrow>Featured brands</Eyebrow>
          <Heading>Brands we love right now</Heading>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {featuredBrands.map((b) => {
              const art = brandById(b.id)?.cover || b.image;
              return (
                <Link key={b.name} href={`/auth?next=${encodeURIComponent(`/brand/${b.id}`)}`} className="group block">
                  <span className="relative block aspect-[3/4] overflow-hidden bg-ink/5">
                    {art ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={art} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
                    ) : (
                      <span className="grid h-full w-full place-items-center font-display text-5xl text-ink/30" aria-hidden>
                        {b.name.charAt(0)}
                      </span>
                    )}
                    <span className="absolute left-0 top-0 bg-ink px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-white">Up to {b.off}% off</span>
                  </span>
                  <span className="mt-3 flex items-center justify-between gap-2 border-b border-ink/10 pb-3 transition group-hover:border-ink/40">
                    <span className="min-w-0">
                      <span className="block truncate font-display text-[18px] font-medium leading-[1.4] tracking-[-0.009em]">{b.name}</span>
                      <span className="block text-[13px] text-ink/50">
                        {b.count} {b.count === 1 ? "pick" : "picks"} on sale
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-ink" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Brand discounts */}
      {!!brands.length && (
        <section className="mx-auto max-w-[1248px] px-4 pb-16 lg:px-6 lg:pb-24">
          <Eyebrow>{isHalloween() ? "🎃 Halloween discounts" : "Today's discounts"}</Eyebrow>
          <Heading>Best of sale</Heading>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {brands.map((b) => (
              <Link
                key={b.name}
                href={b.id ? `/auth?next=${encodeURIComponent(`/brand/${b.id}`)}` : "/auth?next=/discover"}
                className="group flex items-center justify-between border-b border-ink/10 pb-4 transition hover:border-ink/40"
              >
                <span className="min-w-0">
                  <span className="block truncate font-display text-[20px] font-medium leading-[1.5] tracking-[-0.009em]">{b.name}</span>
                  <span className="block text-[13px] text-ink/50">
                    Up to {b.off}% off · {b.count} {b.count === 1 ? "pick" : "picks"}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Our picks, when no price is verified yet: real photos and names, no invented numbers */}
      {!grid.length && !!teasers.length && (
        <section className="mx-auto max-w-[1248px] px-4 pb-16 lg:px-6 lg:pb-24">
          <Eyebrow>{isHalloween() ? "🎃 Halloween picks" : "In the catalogue"}</Eyebrow>
          <Heading>What Lovioo is shopping</Heading>
          <p className="mt-2 max-w-[52ch] text-[13px] leading-[1.6] text-ink/55">
            Prices live with your account, so you always see what each store is charging today — never a number we
            haven&apos;t checked.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {teasers.map((t) => (
              <TeaserCard key={t.name} teaser={t} />
            ))}
          </div>
          <Link
            href="/auth?next=/discover"
            className="mt-10 inline-flex h-11 items-center gap-2 bg-ink px-6 text-sm font-medium text-white transition hover:opacity-85"
          >
            Join free to see prices <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {/* Today's deals, with prices */}
      {!!grid.length && (
        <section className="mx-auto max-w-[1248px] px-4 pb-16 lg:px-6 lg:pb-24">
          <Eyebrow>Prices today</Eyebrow>
          <Heading>What&apos;s dropped in price</Heading>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {grid.map((d) => (
              <DealCard key={d.slug} deal={d} />
            ))}
          </div>
          <Link
            href="/auth?next=/discover"
            className="mt-10 inline-flex h-11 items-center gap-2 bg-ink px-6 text-sm font-medium text-white transition hover:opacity-85"
          >
            See every price <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {/* Categories */}
      <section className="mx-auto max-w-[1248px] px-4 pb-16 lg:px-6 lg:pb-24">
        <Eyebrow>Categories</Eyebrow>
        <Heading>What are you shopping for?</Heading>
        {/* One swipeable row of photo cards on phones; a single row of equal cards on desktop. */}
        <div className="no-scrollbar -mx-4 mt-6 flex snap-x gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0">
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/auth?next=${encodeURIComponent(`/search?category=${c.id}`)}`} className="group shrink-0 snap-start transition active:scale-[0.98]">
              <CategoryCard category={c} className="lg:h-[230px] lg:w-full" />
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-ink/10">
        <div className="mx-auto max-w-[1248px] px-4 py-16 lg:px-6 lg:py-24">
          <Eyebrow>How it works</Eyebrow>
          <Heading className="max-w-[20ch]">Say it the way you&apos;d say it to a friend.</Heading>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              ["01", "Ask in your language", "“Pang-regalo kay mama, mga ₱1,500 lang.” English, Tagalog and Visayan all work."],
              ["02", "Swipe what you love", "Love it or pass. Every swipe teaches your feed what feels like you."],
              ["03", "Shop the best price", "We compare the stores, then send you across to check out."],
            ].map(([n, title, body]) => (
              <li key={n} className="border-t border-ink/15 pt-4">
                <span className="font-display text-[20px] text-ink/35">{n}</span>
                <h3 className="mt-2 font-display text-[20px] font-medium leading-[1.5] tracking-[-0.009em]">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-[1.6] text-ink/55">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Stores */}
      <section className="border-t border-ink/10">
        <div className="mx-auto flex max-w-[1248px] flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p className="font-display text-[20px] font-medium leading-[1.5] tracking-[-0.009em]">Every store. One Lovioo.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink/55">
            {MAIN_RETAILERS.map((r) => (
              <li key={r}>{retailerById(r).name}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-ink/10">
        <div className="mx-auto max-w-[1248px] px-4 py-16 text-center lg:px-6 lg:py-24">
          <h2 className="mx-auto max-w-[18ch] font-display text-[32px] font-medium leading-[1.5] tracking-[-0.012em] sm:text-[42px] sm:leading-[1.43]">
            Your next favourite thing is one sentence away.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            <Link href="/auth?next=/swipe" className="inline-flex h-11 items-center bg-ink px-6 font-medium text-white transition hover:opacity-85">
              Create free account
            </Link>
            <Link href="/auth?mode=signin" className="inline-flex h-11 items-center border border-ink/20 px-6 font-medium text-ink/70 transition hover:border-ink/50 hover:text-ink">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-[1248px] flex-col items-center gap-4 px-4 py-10 sm:flex-row sm:justify-between lg:px-6">
          <Logo tagline />
          <LegalLinks />
        </div>
        <p className="mx-auto max-w-[1248px] px-4 pb-10 text-center text-[11px] leading-[1.6] text-ink/35 sm:text-left lg:px-6">
          Some store links are affiliate links. Prices and availability are set by each retailer and may change.{" "}
          {grid.length
            ? "Prices shown here are today's front-page deals; the full catalogue is for members."
            : "The full catalogue, with prices from every store, is for members."}
        </p>
      </footer>
    </div>
  );
}
