"use client";

import { ArrowUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AI_LANGS, AI_STRINGS, type AiLang } from "@/lib/ai-i18n";
import { askLovioo } from "@/lib/ai";
import { dealsAsProducts, type Deal, type Teaser } from "@/lib/data/public-deals";
import { getSupabase } from "@/lib/supabase/client";
import { trackAi } from "@/lib/sync";
import { cn, peso } from "@/lib/utils";
import { DealCard } from "./DealCard";
import { TeaserCard } from "./TeaserCard";

/**
 * The front page's Lovioo AI box. A guest asks in English, Tagalog or Visayan and gets a real answer from the public
 * deals — prices and all — then an invitation to create an account for the full catalogue.
 */
export function GuestChat({ deals, teasers, starters }: { deals: Deal[]; teasers: Teaser[]; starters?: string[] }) {
  const [lang, setLang] = useState<AiLang>("en");
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState<{ q: string; text: string; picks: Deal[]; teases: Teaser[] } | null>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const strings = AI_STRINGS[lang];
  /** Prices on the front page come from verified offers only. With none, the assistant names products instead. */
  const priced = deals.length > 0;
  const catalogue = useMemo(() => dealsAsProducts(deals), [deals]);

  const ask = (text: string) => {
    const question = text.trim();
    if (!question) return;
    setQ("");
    requestAnimationFrame(() => answerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));

    if (!priced) {
      // No verified price to quote, so match on words alone and say so, rather than invent a number.
      const teases = matchTeasers(question, teasers);
      trackAi(getSupabase(), question, lang, teases.length, "home");
      setAsked({ q: question, text: teases.length ? strings.teaserFound(teases.length) : strings.teaserNone, picks: [], teases });
      return;
    }
    const reply = askLovioo(question, "there", lang, catalogue);
    trackAi(getSupabase(), question, lang, reply.products.length, "home");
    const slugs = new Set(reply.products.slice(0, 4).map((p) => p.slug));
    setAsked({ q: question, text: reply.text.replace(/\*\*/g, ""), picks: deals.filter((d) => slugs.has(d.slug)).slice(0, 4), teases: [] });
  };

  return (
    <div>
      {/* Reply language, in place of daydream's Womens / Mens switch. */}
      <div className="flex items-center justify-center gap-1" role="tablist" aria-label="Reply language">
        {AI_LANGS.map((l) => (
          <button
            key={l.id}
            role="tab"
            aria-selected={lang === l.id}
            onClick={() => setLang(l.id)}
            className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition", lang === l.id ? "bg-pink text-white" : "text-ink/50 hover:text-ink")}
          >
            {l.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
        className="mt-5 flex items-center gap-2 rounded-[1.75rem] bg-white py-2 pl-6 pr-2 shadow-[0_24px_60px_-30px_rgba(255,79,184,0.55)] ring-1 ring-pink/20 transition focus-within:ring-pink/50"
      >
        <label className="sr-only" htmlFor="lovioo-ai">
          {strings.placeholder}
        </label>
        <input
          id="lovioo-ai"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={strings.placeholder}
          className="h-14 min-w-0 flex-1 bg-transparent text-[17px] font-medium leading-none text-ink outline-none placeholder:text-ink/40"
        />
        <button type="submit" aria-label="Ask Lovioo AI" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-white shadow-pop transition hover:brightness-105">
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {(lang === "en" && starters?.length ? starters : strings.starters.slice(0, 4)).map((s) => (
          <button key={s} onClick={() => ask(s)} className="h-9 rounded-full bg-pink-soft px-4 text-[13px] font-semibold text-ink/75 transition hover:bg-pink hover:text-white">
            {s}
          </button>
        ))}
      </div>

      {asked && (
        <div ref={answerRef} className="mt-8 border-t border-ink/10 pt-6">
          <p className="font-display text-[22px] font-medium leading-[1.45] tracking-[-0.012em] text-ink">{asked.q}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{asked.text}</p>
          {!!asked.picks.length && (
            <>
              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
                {asked.picks.map((d) => (
                  <DealCard key={d.slug} deal={d} />
                ))}
              </div>
              <p className="mt-6 text-[13px] text-ink/55">
                That&apos;s {asked.picks.length} of {deals.length} deals on the front page.{" "}
                <Link href="/auth?next=/ai" className="font-bold text-pink underline underline-offset-4">
                  Create a free account
                </Link>{" "}
                to search the whole catalogue, compare every store and get price-drop alerts.
              </p>
            </>
          )}
          {!!asked.teases.length && (
            <>
              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
                {asked.teases.map((t) => (
                  <TeaserCard key={t.name} teaser={t} />
                ))}
              </div>
              <p className="mt-6 text-[13px] text-ink/55">
                Prices on these are for members.{" "}
                <Link href="/auth?next=/ai" className="font-bold text-pink underline underline-offset-4">
                  Create a free account
                </Link>{" "}
                to see every price, compare the stores and get price-drop alerts.
              </p>
            </>
          )}
          {!asked.picks.length && !asked.teases.length && (
            <p className="mt-4 text-[13px] text-ink/55">
              <Link href="/auth?next=/ai" className="font-bold text-pink underline underline-offset-4">
                Create a free account
              </Link>{" "}
              and Lovioo AI will search the whole catalogue, with every store&apos;s price.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Word-match a question against the teaser picks. Deliberately simple: no price logic at all, because the
 * teaser carries no price. Falls back to the first few picks for a question with nothing to match on.
 */
function matchTeasers(q: string, teasers: Teaser[], max = 4): Teaser[] {
  const words = q
    .toLowerCase()
    .split(/[^a-z0-9\u00f1]+/i)
    .filter((w) => w.length > 2);
  if (!words.length) return teasers.slice(0, max);
  const scored = teasers
    .map((t) => {
      const hay = `${t.name} ${t.brand} ${t.category}`.toLowerCase();
      return { t, score: words.filter((w) => hay.includes(w)).length };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((x) => x.t);
}

/** Shown under the hero: today's deals, or — with no verified price yet — how much there is to browse. */
export function DealSummary({ deals, teasers = [] }: { deals: Deal[]; teasers?: Teaser[] }) {
  if (!deals.length) {
    if (!teasers.length) return null;
    const brands = new Set(teasers.map((t) => t.brand)).size;
    return (
      <p className="text-[13px] text-ink/55">
        {teasers.length} picks · {brands} {brands === 1 ? "brand" : "brands"} · prices for members
      </p>
    );
  }
  const best = deals.reduce((m, d) => Math.max(m, d.off), 0);
  const cheapest = deals.reduce((m, d) => Math.min(m, d.price), Infinity);
  return (
    <p className="text-[13px] text-ink/55">
      {deals.length} deals today · up to {best}% off · from {peso(cheapest)}
    </p>
  );
}
