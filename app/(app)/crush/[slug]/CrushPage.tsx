"use client";

import { ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { toast, useHydrated } from "@/components/Providers";
import { CRUSHES, crushBySlug, crushProducts } from "@/lib/data/crush";
import { useLovioo } from "@/lib/store";

/** One Brand Crush collection: its products from the live catalogue, a share button and the other collections. */
export function CrushPage({ slug }: { slug: string }) {
  const crush = crushBySlug(slug)!;
  const hydrated = useHydrated();
  const prefs = useLovioo((s) => s.prefs);
  const swipes = useLovioo((s) => s.swipes);
  const products = useMemo(
    () =>
      crushProducts(crush, {
        prefs,
        likedIds: swipes.filter((x) => x.action !== "nope").map((x) => x.productId),
        nopedIds: swipes.filter((x) => x.action === "nope").map((x) => x.productId),
      }),
    [crush, prefs, swipes],
  );
  const others = CRUSHES.filter((c) => c.series && c.slug !== slug);

  const share = async () => {
    const url = window.location.href;
    const text = `${crush.title} on Lovioo — ${crush.tagline}`;
    try {
      if (navigator.share) await navigator.share({ title: crush.title, text, url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", body: "Share it with someone who'd love these finds." });
      }
    } catch {
      /* share sheet closed */
    }
  };

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-pink-soft via-white to-[#FFF1EA] p-6 sm:p-10">
        <Link href="/crush" className="inline-flex items-center gap-1 text-sm font-semibold text-ink/55 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> All collections
        </Link>
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-pink">Brand Crush series</p>
        <h1 className="mt-1 text-[36px] font-medium leading-[1.2] tracking-[-0.012em] sm:text-[48px]">
          <span aria-hidden>{crush.emoji}</span> {crush.title}
        </h1>
        <p className="mt-2 text-[17px] font-semibold text-ink/75">{crush.tagline}</p>
        <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-ink/55">{crush.description}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button onClick={share} className="btn-primary">
            <Share2 className="h-4 w-4" /> Share this crush
          </button>
          {hydrated && <span className="text-sm text-ink/50">{products.length === 1 ? "1 find" : `${products.length} finds`}</span>}
        </div>
      </header>

      {products.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-surface p-8 text-center">
          <p className="font-display text-[22px] font-medium">New finds are on their way</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink/60">Nothing in this collection yet. Keep discovering — there&apos;s plenty more to love.</p>
          <Link href="/discover" className="btn-primary mt-5">
            Keep discovering
          </Link>
        </div>
      )}

      <section>
        <h2 className="text-[24px] leading-[1.5]">More crushes</h2>
        <div className="no-scrollbar -mx-4 mt-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
          {others.map((c) => (
            <Link key={c.slug} href={`/crush/${c.slug}`} className="w-[180px] shrink-0 snap-start rounded-3xl bg-pink-soft p-4 transition hover:shadow-pop">
              <span className="text-2xl" aria-hidden>
                {c.emoji}
              </span>
              <span className="mt-2 block font-display text-[17px] font-medium">{c.title}</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-ink/55">{c.tagline}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
