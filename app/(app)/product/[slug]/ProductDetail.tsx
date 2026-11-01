"use client";

import { ArrowLeft, Bell, BellRing, Check, Gift, GitCompareArrows, Heart, Palette, Share2, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DiscountBadge } from "@/components/product/DealScore";
import { HeartButton } from "@/components/product/HeartButton";
import { InsightCard } from "@/components/product/InsightCard";
import { OfferTable } from "@/components/product/OfferTable";
import { PriceHistoryChart } from "@/components/product/PriceHistoryChart";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductImage } from "@/components/product/ProductImage";
import { ProductReviews, Stars, useProductReviews } from "@/components/product/ProductReviews";
import { toast, useHydrated } from "@/components/Providers";
import { brandOf } from "@/lib/data/brands";
import { categoryById } from "@/lib/data/categories";
import { bestOffer, discountPct, hasRange, isPriced, offerPriceLabel, productBySlug } from "@/lib/data/products";
import { offerHref, retailerById } from "@/lib/data/retailers";
import { getInsight } from "@/lib/insights";
import { similarProducts } from "@/lib/recommend";
import { useLovioo } from "@/lib/store";
import type { Product, ProductColor } from "@/lib/types";
import { getSupabase } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/sync";
import { cn, compact, peso } from "@/lib/utils";

const TABS = ["Compare offers", "Price history", "Details"] as const;

/** Products load in the browser for members (members-only catalog), so an unknown slug is detected here. */
export function ProductDetail({ slug }: { slug: string }) {
  const product = productBySlug(slug);
  if (!product) notFound();
  return <ProductView product={product} />;
}

function ProductView({ product }: { product: Product }) {
  const hydrated = useHydrated();
  const saved = useLovioo((s) => s.saved.includes(product.id)) && hydrated;
  const alert = useLovioo((s) => s.alerts.find((a) => a.productId === product.id));
  const { toggleSave, setAlert, removeAlert } = useLovioo();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Compare offers");
  const best = bestOffer(product);
  const insight = getInsight(product);
  const pct = discountPct(product);
  const cat = categoryById(product.category);
  const hasAlert = hydrated && !!alert;
  const priced = isPriced(product);
  const tabs = priced ? TABS : TABS.filter((t) => t !== "Price history");
  const router = useRouter();
  const [more, setMore] = useState(false);
  const shop = offerHref(best.retailer, best.url, product.name);
  const reviews = useProductReviews(product.id);
  const promotions = activePromotions(product);
  const colors = product.colors ?? [];
  const [color, setColor] = useState<ProductColor | null>(null);

  useEffect(() => trackEvent(getSupabase(), product.id, "view"), [product.id]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", kind: "ok" });
      }
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <div className="space-y-10 pb-16 lg:pb-0">
      <nav className="truncate text-xs text-ink/50">
        <Link href="/discover" className="hover:text-pink">Home</Link> <span className="mx-1.5">›</span>
        <Link href={`/search?category=${cat.id}`} className="hover:text-pink">{cat.name}</Link> <span className="mx-1.5">›</span>
        <span className="text-ink/70">{product.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {/* The photo on a soft pink glow, with back and save buttons floating over it. */}
        <div className="relative min-w-0 rounded-[2.25rem] bg-gradient-to-b from-pink-soft via-[#FFF3F8] to-white p-3 sm:p-4">
          <div className="pointer-events-none absolute inset-x-10 top-10 h-2/3 rounded-full bg-pink/20 blur-3xl" aria-hidden />
          <ProductGallery
            product={product}
            badge={
              <>
                <button
                  onClick={() => (window.history.length > 1 ? router.back() : router.push("/discover"))}
                  aria-label="Back"
                  className="absolute left-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition hover:bg-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <HeartButton productId={product.id} size="lg" className="absolute right-3 top-3 !bg-white/85" />
                {product.trending && (
                  <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-coral">🔥 Trending</span>
                )}
              </>
            }
          />
        </div>

        <div className="min-w-0 self-start rounded-[2rem] bg-white p-5 shadow-[0_24px_60px_-34px_rgba(17,17,17,0.4)] ring-1 ring-ink/[0.06] sm:p-7">
          {brandOf(product) ? (
            <Link href={`/brand/${brandOf(product)!.id}`} className="text-sm font-semibold text-pink hover:underline">
              {product.brand} · see all {product.brand} products →
            </Link>
          ) : (
            <p className="text-sm font-medium text-ink/50">{product.brand}</p>
          )}
          <h1 className="mt-1 font-sans text-[17px] font-semibold leading-snug tracking-normal [overflow-wrap:anywhere] sm:text-[20px]">{product.name}</h1>
          <Link
            href={`/search?category=${cat.id}`}
            className="mt-2 inline-flex max-w-full items-center gap-1 truncate rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink/65 hover:text-pink"
          >
            <span aria-hidden>{cat.emoji}</span> {cat.name}
            {product.subcategory && <span className="text-ink/40">› {product.subcategory}</span>}
          </Link>
          {(product.reviewCount > 0 || reviews.count > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {product.reviewCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Stars value={product.rating} />
                  <span className="font-semibold">{product.rating}</span>
                  <span className="text-ink/50">
                    {compact(product.reviewCount)} ratings{product.ratingSource ? ` on ${retailerById(product.ratingSource).name}` : ""}
                  </span>
                </span>
              )}
              {reviews.count > 0 && (
                <a href="#reviews" className="flex items-center gap-1 text-ink/60 hover:text-pink">
                  <Star className="h-3.5 w-3.5 fill-pink text-pink" aria-hidden />
                  <span className="font-semibold text-ink">{reviews.average.toFixed(1)}</span> · {reviews.count} Lovioo {reviews.count === 1 ? "review" : "reviews"}
                </a>
              )}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.tags.map((t) => (
              <span key={t} className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold capitalize text-ink/65">
                {t}
              </span>
            ))}
          </div>

          {priced ? (
            <>
              <div className="mt-6 flex items-end gap-3">
                <span className={cn("font-extrabold", hasRange(best) ? "text-[26px] sm:text-3xl" : "text-3xl sm:text-4xl")}>{offerPriceLabel(best)}</span>
                {best.originalPrice > best.price && !hasRange(best) && <span className="pb-1 text-ink/40 line-through">{peso(best.originalPrice)}</span>}
                {!hasRange(best) && <DiscountBadge pct={pct} className="mb-1.5" />}
              </div>
              <p className="mt-1 text-sm text-ink/60">
                {hasRange(best) ? "Price depends on the shade or size you pick" : "Lowest price"} on <b>{retailerById(best.retailer).name}</b> · {product.offers.length === 1 ? "the only store we track for it right now" : `compared across ${product.offers.length} stores`}
              </p>
            </>
          ) : (
            <>
              <p className="mt-6 text-[22px] leading-snug sm:text-[28px]">See prices</p>
              <p className="mt-1 text-sm text-ink/60">
                {insight.headline} — compare sellers in <button onClick={() => setTab("Compare offers")} className="font-semibold text-pink">Where to buy</button> below.
              </p>
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (toggleSave(product.id)) toast({ title: "Saved!", body: "Added to your collection." });
              }}
              className={cn("btn !px-5", saved ? "bg-pink text-white shadow-pop" : "btn-ghost")}
            >
              <Heart className={cn("h-4 w-4", saved && "fill-white")} /> {saved ? "Saved" : "Save"}
            </button>
            {priced && (
              <button
                onClick={() => {
                  if (hasAlert) removeAlert(product.id);
                  else {
                    // Nothing emails yet, so promise only what Saved actually shows.
                    if (setAlert(product.id))
                      toast({ title: "Price alert on 🔔", body: `Watching for under ${peso(insight.lowest90)} — see it in Saved.`, kind: "ok" });
                  }
                }}
                className={cn("btn !px-5", hasAlert ? "bg-grape text-white" : "btn-ghost")}
              >
                {hasAlert ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />} {hasAlert ? "Alert on" : "Price alert"}
              </button>
            )}
            <Link href={`/compare/${product.slug}`} className="btn-ghost !px-5">
              <GitCompareArrows className="h-4 w-4" /> Compare
            </Link>
            <button onClick={share} className="btn-ghost !px-4" aria-label="Share">
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {priced && (
            <a
              href={shop.href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => trackEvent(getSupabase(), product.id, "click_out", best.retailer)}
              className="btn-primary mt-4 hidden w-full !py-3 text-[15px] lg:inline-flex"
            >
              <ShoppingBag className="h-4 w-4" /> Shop on {retailerById(best.retailer).name}
            </a>
          )}

          {promotions.length > 0 && (
            <div className="mt-6">
              <h2 className="flex items-center gap-1.5 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-pink">
                <Gift className="h-4 w-4" aria-hidden /> Promotions
              </h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {promotions.map((p, i) => (
                  <li key={i} className="rounded-2xl bg-pink-soft px-3 py-2 text-[13px] font-semibold text-ink">
                    🎁 {p.text}
                    {(p.retailer || p.endsOn) && (
                      <span className="font-normal text-ink/55">
                        {p.retailer ? ` · ${retailerById(p.retailer).name}` : ""}
                        {p.endsOn ? ` · until ${new Date(p.endsOn + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" })}` : ""}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[11px] text-ink/45">Promotions are set by each store and may change. Check the store before you buy.</p>
            </div>
          )}

          {colors.length > 0 && (
            <div className="mt-6">
              <h2 className="flex items-center gap-1.5 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-pink">
                <Palette className="h-4 w-4" aria-hidden /> Colors · {colors.length} {colors.length === 1 ? "option" : "options"}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Colors">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    role="radio"
                    aria-checked={color?.name === c.name}
                    onClick={() => setColor(color?.name === c.name ? null : c)}
                    className={cn(
                      "flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-[13px] font-semibold ring-1 transition",
                      color?.name === c.name ? "bg-pink-soft text-pink ring-pink" : "bg-white text-ink/75 ring-ink/10 hover:ring-pink",
                    )}
                  >
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <span className="h-6 w-6 rounded-full ring-1 ring-ink/10" style={{ background: c.hex || "#F3E8EE" }} aria-hidden />
                    )}
                    {c.name}
                  </button>
                ))}
              </div>
              {color?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={color.image} alt={`${product.name}, ${color.name}`} className="mt-3 aspect-square w-40 rounded-2xl bg-pink-soft object-cover" />
              )}
              <p className="mt-1.5 text-[11px] text-ink/45">Pick your shade on the store when you buy.</p>
            </div>
          )}

          <div className="mt-6">
            <InsightCard product={product} />
          </div>
          {product.description && (
            <div className="mt-5 rounded-[1.5rem] bg-pink-soft p-4">
              <h2 className="text-[18px] leading-snug">Description</h2>
              <p className={cn("mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink/70", !more && "line-clamp-4")}>{product.description}</p>
              {product.description.length > 220 && (
                <button onClick={() => setMore((m) => !m)} className="mt-1 text-sm font-bold text-pink">
                  {more ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <section id="offers" className="scroll-mt-20 rounded-[2rem] bg-white p-5 shadow-[0_24px_60px_-38px_rgba(17,17,17,0.35)] ring-1 ring-ink/[0.06] sm:p-6">
        <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-ink/15">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("-mb-px shrink-0 border-b-2 pb-3 text-sm font-semibold transition", tab === t ? "border-pink text-pink" : "border-transparent text-ink/50")}>
              {t === "Compare offers" && !priced ? "Where to buy" : t}
            </button>
          ))}
        </div>
        <div className="mt-5">
          {tab === "Compare offers" && (
            <>
              <OfferTable product={product} />
              <p className="mt-3 text-xs text-ink/50">
                {priced && lastChecked(product.offers)}Prices and availability are set by each retailer and may change — check the store before you buy.
              </p>
            </>
          )}
          {tab === "Price history" && priced && <PriceHistoryChart product={product} />}
          {tab === "Details" && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {product.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-pink/10 text-pink">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {h}
                </li>
              ))}
              <li className="text-sm text-ink/60">Category: {cat.name} › {product.subcategory}</li>
            </ul>
          )}
        </div>
      </section>

      <ProductReviews productId={product.id} state={reviews} />

      <StickyBuyBar product={product} priced={priced} onCompare={() => setTab("Compare offers")} />

      <section>
        <h2 className="text-[20px] leading-[1.5]">You might also love</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {similarProducts(product).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

/** Store promotions that haven't ended yet (end dates are read as Philippine dates). */
function activePromotions(product: Product) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  return (product.promotions ?? []).filter((p) => !p.endsOn || p.endsOn >= today);
}

function lastChecked(offers: { updatedAt?: string }[]) {
  const times = offers.map((o) => (o.updatedAt ? Date.parse(o.updatedAt) : NaN)).filter((t) => !Number.isNaN(t));
  if (!times.length) return "";
  const d = new Date(Math.max(...times));
  return `Prices last checked ${d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })}. `;
}

/** Phone-only bar above the tab bar: the best price and a one-tap way to the store. */
function StickyBuyBar({ product, priced, onCompare }: { product: ReturnType<typeof productBySlug> & {}; priced: boolean; onCompare: () => void }) {
  const best = bestOffer(product);
  const link = offerHref(best.retailer, best.url, product.name);
  return (
    <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 rounded-[1.75rem] bg-white/80 p-2 pl-5 text-ink shadow-[0_18px_40px_-16px_rgba(255,79,184,0.45)] ring-1 ring-pink/15 backdrop-blur-xl lg:hidden">
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold text-ink/50">{priced ? `Best price · ${retailerById(best.retailer).name}` : `${product.offers.length} stores`}</span>
        <span className="block truncate text-[20px] font-extrabold leading-tight">{priced ? offerPriceLabel(best, "–") : "See live prices"}</span>
      </span>
      {priced ? (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => trackEvent(getSupabase(), product.id, "click_out", best.retailer)}
          aria-label={`Shop on ${retailerById(best.retailer).name}`}
          className="inline-flex h-14 items-center gap-2 rounded-[1.25rem] bg-pink px-5 text-[15px] font-bold text-white shadow-pop"
        >
          <ShoppingBag className="h-5 w-5" /> Shop
        </a>
      ) : (
        <button
          onClick={() => {
            onCompare();
            document.getElementById("offers")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="inline-flex h-14 items-center gap-2 rounded-[1.25rem] bg-pink px-5 text-[15px] font-bold text-white shadow-pop"
        >
          Where to buy
        </button>
      )}
    </div>
  );
}
