"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/product/ProductImage";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { useHydrated } from "@/components/Providers";
import { askLovioo, buyOrWait, type AiReply } from "@/lib/ai";
import { productById } from "@/lib/data/products";
import { getInsight } from "@/lib/insights";
import { useLovioo } from "@/lib/store";
import type { Product } from "@/lib/types";
import { cn, peso } from "@/lib/utils";

interface Msg {
  id: number;
  role: "user" | "ai";
  text: string;
  products?: Product[];
  followUps?: string[];
}

const STARTERS = ["Best deals on sneakers", "Skincare under ₱1,000", "Home essentials", "Trending on TikTok Shop", "Gift ideas under ₱2,000"];

/** Renders **bold** segments from the scripted replies. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
            part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
          )}
        </Fragment>
      ))}
    </>
  );
}

function MiniProduct({ p }: { p: Product }) {
  const i = getInsight(p);
  return (
    <Link href={`/product/${p.slug}`} className="flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-soft">
      <ProductImage product={p} className="aspect-[4/3]" emojiSize="text-4xl" />
      <div className="p-2.5">
        <p className="line-clamp-2 text-xs font-semibold leading-snug">{p.name}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className={cn("text-sm font-bold", !i.priced && "text-pink")}>{i.priced ? peso(i.bestOffer.price) : "See prices"}</span>
          <RetailerBadge id={i.bestOffer.retailer} size="xs" />
        </div>
      </div>
    </Link>
  );
}

export function AiChat({ compact = false }: { compact?: boolean }) {
  const hydrated = useHydrated();
  const user = useLovioo((s) => s.user);
  const saved = useLovioo((s) => s.saved);
  const name = hydrated && user ? user.name.split(" ")[0] : "there";
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const lastProducts = useRef<Product[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || typing) return;
    setMsgs((m) => [...m, { id: Date.now(), role: "user", text: t }]);
    setInput("");
    setTyping(true);
    window.setTimeout(() => {
      let reply: AiReply;
      if (/buy now or wait|should i buy/i.test(t)) {
        const ctx = lastProducts.current.length
          ? lastProducts.current
          : (saved.map(productById).filter(Boolean) as Product[]);
        reply = buyOrWait(ctx);
      } else reply = askLovioo(t, name);
      if (reply.products.length) lastProducts.current = reply.products;
      setMsgs((m) => [...m, { id: Date.now() + 1, role: "ai", ...reply }]);
      setTyping(false);
    }, 700 + Math.random() * 500);
  };

  return (
    <div className={cn("flex h-full flex-col", compact ? "" : "card overflow-hidden")}>
      <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        <div className="rounded-3xl bg-gradient-to-br from-grape/10 via-pink/10 to-sunset/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-grape">
            <Sparkles className="h-4 w-4" /> Lovioo AI <span className="rounded-full bg-grape/10 px-2 py-0.5 text-[10px]">Beta</span>
          </p>
          <p className="mt-2 text-lg font-bold">Hi {name}! 👋</p>
          <p className="text-sm text-midnight/70">What are you looking for today? I compare prices across stores and tell you when to buy.</p>
          {msgs.length === 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full bg-white px-3.5 py-2 text-xs font-medium text-grape shadow-sm transition hover:-translate-y-0.5">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence initial={false}>
          {msgs.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-3xl px-4 py-2.5 text-sm",
                  m.role === "user" ? "rounded-br-md bg-pink text-white" : "rounded-bl-md bg-white text-midnight shadow-sm ring-1 ring-line",
                )}
              >
                <RichText text={m.text} />
              </div>
              {m.products && m.products.length > 0 && (
                <div className="no-scrollbar mt-2 flex max-w-full gap-2 overflow-x-auto pb-1">
                  {m.products.map((p) => (
                    <MiniProduct key={p.id} p={p} />
                  ))}
                </div>
              )}
              {m.followUps && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.followUps.map((f) => (
                    <button key={f} onClick={() => send(f)} className="chip !py-1 text-[11px]">
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {typing && (
          <div className="flex w-16 items-center gap-1 rounded-3xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-line" aria-label="Lovioo AI is typing">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-pink" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
            ))}
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-line/70 bg-white p-3"
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Lovioo AI anything…" className="input !rounded-full !py-2.5" aria-label="Message Lovioo AI" />
        <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pink text-white shadow-pop disabled:opacity-40" disabled={!input.trim()} aria-label="Send">
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
