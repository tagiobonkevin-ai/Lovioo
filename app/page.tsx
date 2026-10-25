import { ArrowRight, BarChart3, Heart, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { HeroDeck } from "@/components/landing/HeroDeck";
import { CategoryBubbles } from "@/components/product/CategoryBubbles";
import { ProductCard } from "@/components/product/ProductCard";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { PRODUCTS } from "@/lib/data/products";
import { ALL_RETAILERS, RETAILERS } from "@/lib/data/retailers";

const FEATURES = [
  { icon: Search, title: "Discover", body: "Products you'll love, tuned to your taste with every swipe.", tint: "bg-pink/10 text-pink" },
  { icon: BarChart3, title: "Compare", body: "Best deals & prices across Shopee, Lazada, TikTok Shop and Amazon.", tint: "bg-coral/10 text-coral" },
  { icon: Sparkles, title: "AI Insights", body: "Deal scores and “buy now or wait” calls from 90 days of price history.", tint: "bg-grape/10 text-grape" },
  { icon: Heart, title: "Save & Alerts", body: "Heart anything and get pinged on price drops and restocks.", tint: "bg-sunset/15 text-[#E08A00]" },
];

export default function Landing() {
  const trending = PRODUCTS.filter((p) => p.trending).slice(0, 4);
  return (
    <div className="min-h-screen overflow-x-hidden bg-cream">
      <header className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 lg:px-6">
        <Logo />
        <nav className="hidden gap-6 text-sm font-medium text-midnight/70 md:flex">
          <Link href="/discover" className="hover:text-pink">Discover</Link>
          <Link href="/swipe" className="hover:text-pink">Swipe</Link>
          <Link href="/search" className="hover:text-pink">Categories</Link>
          <Link href="/search?sort=discount" className="hover:text-pink">Deals</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/auth?mode=signin" className="btn hidden text-midnight/80 hover:text-pink sm:inline-flex">
            Sign in
          </Link>
          <Link href="/auth" className="btn-primary !py-2">
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-pink/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 top-40 h-96 w-96 rounded-full bg-sunset/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-8 lg:grid-cols-2 lg:px-6 lg:pt-16">
          <div>
            <span className="chip border-pink/30 bg-white/70 text-pink">💘 New: Swipe mode is here</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Discover amazing <br />
              <span className="text-gradient">products you&apos;ll love.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-midnight/70 sm:text-lg">
              Swipe through picks made for you, compare deals across multiple retailers, and let Lovioo AI tell you when to buy.
            </p>
            <form action="/search" className="mt-7 flex max-w-lg items-center gap-2 rounded-full bg-white p-1.5 shadow-soft ring-1 ring-line">
              <Search className="ml-3 h-5 w-5 shrink-0 text-midnight/40" />
              <input name="q" placeholder="Search products, brands or categories…" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
              <button className="btn-primary !px-4" aria-label="Search">
                <Search className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/swipe" className="btn-gradient !px-6 !py-3 text-base">
                Start swiping <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/discover" className="btn-ghost !px-6 !py-3 text-base">
                Explore deals
              </Link>
            </div>
          </div>
          <HeroDeck />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <CategoryBubbles />
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">Discover more. Shop smarter. Live better.</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 transition hover:-translate-y-1">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${f.tint}`}>
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-midnight/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight">Trending right now 🔥</h2>
          <Link href="/search?sort=trending" className="text-sm font-semibold text-pink">
            See all
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {trending.map((p) => (
            <ProductCard key={p.id} product={p} showCompare={false} />
          ))}
        </div>
      </section>

      {/* Platforms */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="rounded-[2rem] bg-midnight p-8 text-white sm:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">One app. Every store.</h2>
              <p className="mt-3 text-white/70">Compare deals from multiple retailers in one place. Prices refresh regularly and we always send you to the retailer to check out.</p>
              <Link href="/auth" className="btn-gradient mt-6">
                Join Lovioo — it&apos;s free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ALL_RETAILERS.map((r) => (
                <div key={r} className="flex flex-col items-center gap-2 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <RetailerBadge id={r} size="md" />
                  <span className="text-xs font-medium text-white/80">{RETAILERS[r].name}</span>
                </div>
              ))}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 p-4 text-xs text-white/50">
                + More soon
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-10 text-xs text-midnight/50 sm:flex-row lg:px-6">
        <Logo tagline />
        <p>Illustrative concept with mock data. Prices and availability are set by each retailer.</p>
      </footer>
    </div>
  );
}
