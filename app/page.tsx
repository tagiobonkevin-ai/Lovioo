import { ArrowRight, Heart, MessageCircle, Search, ShoppingBag, Sparkles, Tag } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { DealCard } from "@/components/landing/DealCard";
import { PhoneMock } from "@/components/landing/PhoneMock";
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

/** Small pink uppercase label above each section. */
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-pink">{children}</p>
);

const Heading = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h2 className={cn("mt-1 text-[26px] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink sm:text-[32px]", className)}>{children}</h2>
);

/** The brand sheet's icon style: a pink line icon in a soft light-pink circle. */
const IconBubble = ({ icon: Icon, className }: { icon: typeof Search; className?: string }) => (
  <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-full bg-pink-soft text-pink", className)} aria-hidden>
    <Icon className="h-5 w-5" strokeWidth={2.2} />
  </span>
);

const FEATURES = [
  { icon: Search, title: "Discover", body: "Find products you'll love" },
  { icon: Heart, title: "Swipe", body: "Save your favourites" },
  { icon: Tag, title: "Compare", body: "See the best deals" },
  { icon: ShoppingBag, title: "Shop", body: "Go to your preferred store" },
];

const pill = "inline-flex h-12 items-center gap-2 rounded-full px-7 text-[15px] font-bold transition active:scale-[0.98]";

/**
 * The front page, in the Lovioo brand: Manrope, pink and coral on white and light pink, soft pink icon bubbles and
 * pill buttons. Real numbers only — today's discounts with prices; the catalogue behind it needs an account.
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
  const heroDeal = deals.find((d) => d.image) ?? deals[0];

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-ui text-ink antialiased">
      {/* Hero: soft white-to-pink wash with the brand's pink shapes */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-white via-[#FFF3F8] to-pink-soft">
        <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-pink/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-80 w-80 rounded-full bg-coral/20 blur-3xl" aria-hidden />

        <header className="mx-auto flex h-16 max-w-[1248px] items-center gap-6 px-4 lg:px-6">
          <Logo />
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <Link href="/auth?mode=signin" className="px-3 py-2 font-semibold text-ink/65 transition hover:text-ink sm:px-4">
              Sign in
            </Link>
            <Link href="/auth?next=/swipe" className="rounded-full bg-pink px-4 py-2 font-bold text-white shadow-pop transition hover:brightness-105">
              Join free
            </Link>
          </nav>
        </header>

        <section className="relative mx-auto grid max-w-[1248px] items-center gap-12 px-4 pb-16 pt-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-6 lg:pb-24 lg:pt-14">
          <HalloweenDecor />
          <div className="min-w-0">
            <HalloweenNote className="mb-3" />
            <h1 className="text-[44px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[60px] lg:text-[72px]">
              Swipe. <span className="text-pink">Love.</span> Shop.
            </h1>
            <p className="mt-5 max-w-[34ch] text-[17px] font-medium leading-relaxed text-ink/70 sm:text-[19px]">
              Discover amazing products from every store in the Philippines through one AI chat.
            </p>
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
              {FEATURES.map((f) => (
                <li key={f.title} className="min-w-0">
                  <IconBubble icon={f.icon} />
                  <p className="mt-3 text-[15px] font-bold">{f.title}</p>
                  <p className="text-[13px] leading-snug text-ink/55">{f.body}</p>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/auth?next=/swipe" className={cn(pill, "bg-pink text-white shadow-pop hover:brightness-105")}>
                Try Lovioo Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/auth?mode=signin" className={cn(pill, "bg-white text-ink ring-1 ring-ink/10 hover:ring-ink/25")}>
                Sign in
              </Link>
            </div>
          </div>
          <PhoneMock deal={heroDeal} teaser={teasers[0]} />
        </section>
      </div>

      {/* Just ask Lovioo: the guest AI chat */}
      <section className="mx-auto max-w-[1248px] px-4 py-16 lg:px-6 lg:py-24">
        <div className="mx-auto max-w-[760px] text-center">
          <IconBubble icon={MessageCircle} className="mx-auto" />
          <h2 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">
            Just ask <span className="text-pink">Lovioo.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-[46ch] text-[15px] leading-relaxed text-ink/60">
            Say what you want in English, Tagalog or Visayan. We compare Shopee, Lazada, TikTok Shop and Amazon and show you what&apos;s
            actually worth it.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-[720px] rounded-[2rem] bg-white p-4 shadow-[0_24px_60px_-30px_rgba(255,79,184,0.45)] ring-1 ring-pink/15 sm:p-6">
          <GuestChat deals={deals} teasers={teasers} />
        </div>
        <div className="mx-auto mt-6 max-w-[720px] text-center">
          <DealSummary deals={deals} teasers={teasers} />
        </div>
      </section>

      {/* Featured brands: chosen in Admin -> Brands, shown with one of their product photos */}
      {!!featuredBrands.length && (
        <section className="mx-auto max-w-[1248px] px-4 pb-16 lg:px-6 lg:pb-24">
          <Eyebrow>Featured brands</Eyebrow>
          <Heading>Brands we love right now</Heading>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featuredBrands.map((b) => {
              const art = brandById(b.id)?.cover || b.image;
              return (
                <Link
                  key={b.name}
                  href={`/auth?next=${encodeURIComponent(`/brand/${b.id}`)}`}
                  className="group block rounded-3xl bg-pink-soft p-2 transition hover:shadow-[0_18px_40px_-20px_rgba(255,79,184,0.6)]"
                >
                  <span className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-white">
                    {art ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={art} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-5xl font-extrabold text-pink/40" aria-hidden>
                        {b.name.charAt(0)}
                      </span>
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-pink px-2.5 py-1 text-[11px] font-bold text-white">Up to {b.off}% off</span>
                  </span>
                  <span className="flex items-center justify-between gap-2 px-2 pb-1.5 pt-3">
                    <span className="min-w-0">
                      <span className="block truncate text-[16px] font-extrabold tracking-[-0.01em]">{b.name}</span>
                      <span className="block text-[12px] text-ink/55">
                        {b.count} {b.count === 1 ? "pick" : "picks"} on sale
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-pink transition group-hover:translate-x-0.5" />
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
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {brands.map((b) => (
              <Link
                key={b.name}
                href={b.id ? `/auth?next=${encodeURIComponent(`/brand/${b.id}`)}` : "/auth?next=/discover"}
                className="group flex items-center justify-between rounded-2xl bg-surface px-4 py-3.5 transition hover:bg-pink-soft"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[16px] font-bold">{b.name}</span>
                  <span className="block text-[13px] text-ink/55">
                    Up to {b.off}% off · {b.count} {b.count === 1 ? "pick" : "picks"}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-pink transition group-hover:translate-x-0.5" />
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
          <Link href="/auth?next=/discover" className={cn(pill, "mt-10 bg-pink text-white shadow-pop hover:brightness-105")}>
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
          <Link href="/auth?next=/discover" className={cn(pill, "mt-10 bg-pink text-white shadow-pop hover:brightness-105")}>
            See every price <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {/* Categories */}
      <section className="mx-auto max-w-[1248px] px-4 pb-16 lg:px-6 lg:pb-24">
        <Eyebrow>Categories</Eyebrow>
        <Heading>What are you shopping for?</Heading>
        {/* One swipeable row of photo cards on phones; a single row of equal cards on desktop. */}
        <div className="no-scrollbar -mx-4 mt-6 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0">
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/auth?next=${encodeURIComponent(`/search?category=${c.id}`)}`} className="group shrink-0 snap-start transition active:scale-[0.98]">
              <CategoryCard category={c} className="lg:h-[230px] lg:w-full" />
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface">
        <div className="mx-auto max-w-[1248px] px-4 py-16 lg:px-6 lg:py-24">
          <Eyebrow>How it works</Eyebrow>
          <Heading className="max-w-[20ch]">Say it the way you&apos;d say it to a friend.</Heading>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: MessageCircle, title: "Ask in your language", body: "“Pang-regalo kay mama, mga ₱1,500 lang.” English, Tagalog and Visayan all work." },
              { icon: Heart, title: "Swipe what you love", body: "Love it or pass. Every swipe teaches your feed what feels like you." },
              { icon: ShoppingBag, title: "Shop the best price", body: "We compare the stores, then send you across to check out." },
            ].map((s) => (
              <li key={s.title} className="rounded-3xl bg-white p-6">
                <IconBubble icon={s.icon} />
                <h3 className="mt-4 text-[18px] font-extrabold leading-snug tracking-[-0.01em]">{s.title}</h3>
                <p className="mt-1.5 text-[14px] leading-[1.6] text-ink/60">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Stores */}
      <section className="mx-auto flex max-w-[1248px] flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p className="text-[20px] font-extrabold tracking-[-0.02em]">
          Every store. <span className="text-pink">One Lovioo.</span>
        </p>
        <ul className="flex flex-wrap gap-2">
          {MAIN_RETAILERS.map((r) => (
            <li key={r} className="rounded-full bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-ink/70">
              {retailerById(r).name}
            </li>
          ))}
        </ul>
      </section>

      {/* Closing */}
      <section className="px-4 pb-16 lg:px-6 lg:pb-24">
        <div className="relative isolate mx-auto max-w-[1248px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-pink-soft via-white to-[#FFF1EA] px-6 py-14 text-center sm:px-12 lg:py-20">
          <div className="pointer-events-none absolute -right-16 -top-16 -z-10 h-64 w-64 rounded-full bg-pink/20 blur-3xl" aria-hidden />
          <IconBubble icon={Sparkles} className="mx-auto bg-white" />
          <h2 className="mx-auto mt-4 max-w-[16ch] text-[34px] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-[46px]">
            Shop smarter. <span className="whitespace-nowrap text-pink">Live better.</span>
          </h2>
          <p className="mt-3 text-[15px] font-medium text-ink/60">Gadgets. Fashion. Beauty. Home. Lifestyle. And more.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/auth?next=/discover" className={cn(pill, "bg-pink text-white shadow-pop hover:brightness-105")}>
              Discover Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/auth?mode=signin" className={cn(pill, "bg-white text-ink ring-1 ring-ink/10 hover:ring-ink/25")}>
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
        <p className="mx-auto max-w-[1248px] px-4 pb-10 text-center text-[11px] leading-[1.6] text-ink/40 sm:text-left lg:px-6">
          Some store links are affiliate links. Prices and availability are set by each retailer and may change.{" "}
          {grid.length
            ? "Prices shown here are today's front-page deals; the full catalogue is for members."
            : "The full catalogue, with prices from every store, is for members."}
        </p>
      </footer>
    </div>
  );
}
