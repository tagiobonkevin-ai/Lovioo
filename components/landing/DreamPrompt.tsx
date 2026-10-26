"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Written the way people actually shop: plain words, budgets, Taglish.
const IDEAS = [
  "A cute dress for a beach wedding, under ₱2,000",
  "Pang-regalo kay mama, mga ₱1,500 lang",
  "Wireless earbuds that won't fall out at the gym",
  "Cozy things for a rainy weekend at home",
  "Skincare for oily skin, Korean brands",
  "A desk setup upgrade for working from home",
];

/** The hero prompt: describe what you want in your own words, and Lovioo AI takes it from there. */
export function DreamPrompt({ className, chips = true }: { className?: string; chips?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [hint, setHint] = useState(IDEAS[0]);

  // A typewriter placeholder cycling through example requests (static when the user prefers less motion).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let idea = 0;
    let len = IDEAS[0].length;
    let phase: "hold" | "erase" | "type" = "hold";
    let wait = 40;
    const t = window.setInterval(() => {
      if (wait > 0) return void wait--;
      if (phase === "hold") phase = "erase";
      else if (phase === "erase") {
        len -= 2;
        if (len <= 0) {
          len = 0;
          idea = (idea + 1) % IDEAS.length;
          phase = "type";
        }
      } else if (++len >= IDEAS[idea].length) {
        phase = "hold";
        wait = 40;
      }
      setHint(IDEAS[idea].slice(0, len));
    }, 45);
    return () => window.clearInterval(t);
  }, []);

  const go = (text: string) => {
    const q = text.trim();
    router.push(q ? `/ai?q=${encodeURIComponent(q)}` : "/ai");
  };

  return (
    <div className={className}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(value);
        }}
        className="group relative rounded-[1.75rem] bg-white p-2 shadow-[0_20px_60px_-25px_rgba(15,39,66,0.35)] ring-1 ring-midnight/10 transition focus-within:ring-2 focus-within:ring-pink/40"
      >
        <label htmlFor="dream" className="sr-only">
          Describe what you&apos;re looking for
        </label>
        <textarea
          id="dream"
          rows={2}
          value={value}
          maxLength={300}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              go(value);
            }
          }}
          placeholder={hint}
          className="block w-full resize-none bg-transparent px-4 pb-1 pt-3 text-base text-midnight outline-none placeholder:text-midnight/35 sm:text-lg"
        />
        <div className="flex items-center justify-between gap-2 px-2 pb-1">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-midnight/40">
            <Sparkles className="h-3.5 w-3.5 text-pink" /> English, Tagalog or Bisaya
          </span>
          <button
            type="submit"
            aria-label="Find it"
            className={cn("grid h-10 w-10 place-items-center rounded-full text-white transition active:scale-95", value.trim() ? "bg-midnight" : "bg-midnight/80")}
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </form>
      {chips && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {IDEAS.slice(0, 4).map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => go(idea)}
              className="rounded-full border border-midnight/10 bg-white/60 px-3.5 py-1.5 text-xs text-midnight/70 backdrop-blur transition hover:border-pink/40 hover:text-pink"
            >
              {idea}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
