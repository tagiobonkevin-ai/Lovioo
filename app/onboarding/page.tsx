"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { BUDGETS, CATEGORIES } from "@/lib/data/categories";
import { ALL_RETAILERS, retailerById } from "@/lib/data/retailers";
import { useLovioo } from "@/lib/store";
import type { CategoryId, Preferences, RetailerId } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["What are you into?", "Your typical budget", "Where do you shop?"];

export default function Onboarding() {
  const router = useRouter();
  const { setPrefs, completeOnboarding } = useLovioo();
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<CategoryId[]>([]);
  const [budget, setBudget] = useState<Preferences["budget"]>(null);
  const [platforms, setPlatforms] = useState<RetailerId[]>(["shopee", "lazada", "tiktok", "amazon"]);

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const done = () => {
    setPrefs({ interests, budget, platforms });
    completeOnboarding();
    router.push("/swipe");
  };
  const skip = () => {
    completeOnboarding();
    router.push("/discover");
  };

  return (
    <div className="min-h-screen bg-brand-soft">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Logo />
        <button onClick={skip} className="text-sm font-medium text-midnight/60 hover:text-pink">
          Skip for now
        </button>
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <div className="card p-6 sm:p-10">
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <span key={i} className={cn("h-2 rounded-full transition-all", i === step ? "w-10 bg-pink" : i < step ? "w-4 bg-pink/50" : "w-4 bg-line")} />
            ))}
            <span className="ml-auto text-xs text-midnight/50">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Personalise your experience</h1>
          <p className="mt-1 text-sm text-midnight/60">Optional — this just makes your swipe deck smarter. You can change it later.</p>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="mt-8">
              <h2 className="text-lg font-bold">{STEPS[step]}</h2>
              {step === 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {CATEGORIES.map((c) => {
                    const on = interests.includes(c.id);
                    return (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        key={c.id}
                        onClick={() => setInterests(toggle(interests, c.id))}
                        className={cn("relative flex items-center gap-3 rounded-2xl border-2 p-4 text-left text-sm font-semibold transition", on ? "border-pink bg-pink/5" : "border-line bg-white hover:border-pink/30")}
                      >
                        <span className="grid h-10 w-10 place-items-center rounded-xl text-xl" style={{ background: c.tint }}>
                          {c.emoji}
                        </span>
                        {c.name}
                        {on && (
                          <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-pink text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
              {step === 1 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {BUDGETS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBudget(b.id)}
                      className={cn("rounded-2xl border-2 px-4 py-5 text-sm font-semibold transition", budget === b.id ? "border-pink bg-pink text-white shadow-pop" : "border-line bg-white hover:border-pink/30")}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              )}
              {step === 2 && (
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {ALL_RETAILERS.map((r) => {
                    const on = platforms.includes(r);
                    return (
                      <button
                        key={r}
                        onClick={() => setPlatforms(toggle(platforms, r))}
                        className={cn("relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-xs font-semibold transition", on ? "border-pink bg-pink/5" : "border-line bg-white")}
                      >
                        <RetailerBadge id={r} size="md" />
                        {retailerById(r).name}
                        {on && (
                          <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-pink text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-between">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="btn-ghost">
                Back
              </button>
            ) : (
              <Link href="/discover" className="btn text-midnight/60">
                Not now
              </Link>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="btn-primary !px-8">
                Continue
              </button>
            ) : (
              <button onClick={done} className="btn-gradient !px-8">
                Start swiping 💘
              </button>
            )}
          </div>
        </div>
        <LegalLinks className="mt-6" />
      </div>
    </div>
  );
}
