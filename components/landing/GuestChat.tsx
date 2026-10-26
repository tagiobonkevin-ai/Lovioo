"use client";

import { ArrowUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AI_LANGS, AI_STRINGS, type AiLang } from "@/lib/ai-i18n";
import { askLovioo } from "@/lib/ai";
import { dealsAsProducts, type Deal } from "@/lib/data/public-deals";
import { cn, peso } from "@/lib/utils";
import { DealCard } from "./DealCard";

/**
 * The front page's Lovioo AI box. A guest asks in English, Tagalog or Visayan and gets a real answer from the public
 * deals — prices and all — then an invitation to create an account for the full catalogue.
 */
export function GuestChat({ deals }: { deals: Deal[] }) {
  const [lang, setLang] = useState<AiLang>("en");
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState<{ q: string; text: string; picks: Deal[] } | null>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const strings = AI_STRINGS[lang];
  const catalogue = useMemo(() => dealsAsProducts(deals), [deals]);

  const ask = (text: string) => {
    const question = text.trim();
    if (!question) return;
    const reply = askLovioo(question, "there", lang, catalogue);
    const slugs = new Set(reply.products.slice(0, 4).map((p) => p.slug));
    setAsked({ q: question, text: reply.text.replace(/\*\*/g, ""), picks: deals.filter((d) => slugs.has(d.slug)).slice(0, 4) });
    setQ("");
    requestAnimationFrame(() => answerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
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
            className={cn("px-4 py-2 text-sm transition", lang === l.id ? "font-medium text-ink" : "text-ink/45 hover:text-ink/70")}
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
        className="mt-3 flex items-end gap-3 border-b border-ink/15 pb-3 focus-within:border-ink/40"
      >
        <label className="sr-only" htmlFor="lovioo-ai">
          {strings.placeholder}
        </label>
        <input
          id="lovioo-ai"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={strings.placeholder}
          className="h-10 min-w-0 flex-1 bg-transparent font-display text-[18px] leading-none text-ink outline-none placeholder:text-ink/35"
        />
        <button type="submit" aria-label="Ask Lovioo AI" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-white transition hover:opacity-80">
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {strings.starters.slice(0, 4).map((s) => (
          <button key={s} onClick={() => ask(s)} className="h-9 rounded-full border border-ink/15 px-4 text-[13px] text-ink/70 transition hover:border-ink/40 hover:text-ink">
            {s}
          </button>
        ))}
      </div>

      {asked && (
        <div ref={answerRef} className="mt-8 border-t border-ink/10 pt-6">
          <p className="font-display text-[22px] leading-[1.45] tracking-[-0.012em] text-ink">{asked.q}</p>
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
                <Link href="/auth?next=/ai" className="font-medium text-ink underline underline-offset-4">
                  Create a free account
                </Link>{" "}
                to search the whole catalogue, compare every store and get price-drop alerts.
              </p>
            </>
          )}
          {!asked.picks.length && (
            <p className="mt-4 text-[13px] text-ink/55">
              <Link href="/auth?next=/ai" className="font-medium text-ink underline underline-offset-4">
                Create a free account
              </Link>{" "}
              and Lovioo AI will search the whole catalogue, not just today&apos;s front-page deals.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Shown under the hero: how many deals there are and the biggest discount today. */
export function DealSummary({ deals }: { deals: Deal[] }) {
  const best = deals.reduce((m, d) => Math.max(m, d.off), 0);
  const cheapest = deals.reduce((m, d) => Math.min(m, d.price), Infinity);
  if (!deals.length) return null;
  return (
    <p className="text-[13px] text-ink/55">
      {deals.length} deals today · up to {best}% off · from {peso(cheapest)}
    </p>
  );
}
