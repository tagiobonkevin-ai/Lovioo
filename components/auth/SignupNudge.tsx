"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, Heart, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { closeSignupNudge, useSignupNudge } from "@/lib/signup-nudge";

const COPY = {
  save: {
    icon: Heart,
    title: "Saved on this phone 💗",
    body: "Create a free account to keep your loves on every device, build your wishlist and get price alerts.",
  },
  preview: {
    icon: Heart,
    title: "Love it? Join free to save it 💗",
    body: "Create a free account to see every product, save your favourites, swipe your feed and get price alerts.",
  },
  alert: {
    icon: Bell,
    title: "Get price alerts with a free account",
    body: "Lovioo watches the price for you and shows the drop in Saved. It takes a minute to join.",
  },
} as const;

/** The contextual sign-up sheet for guests: shown when they save something or ask for a price alert. */
export function SignupNudge() {
  const reason = useSignupNudge((s) => s.reason);
  const pathname = usePathname();
  const copy = reason ? COPY[reason] : null;
  return (
    <AnimatePresence>
      {copy && (
        <motion.div
          key={reason}
          role="dialog"
          aria-modal="false"
          aria-labelledby="signup-nudge-title"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-md rounded-3xl bg-white p-5 shadow-[0_24px_60px_-20px_rgba(17,17,17,0.35)] ring-1 ring-pink/15 lg:bottom-6"
        >
          <button onClick={closeSignupNudge} aria-label="Not now" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-ink/45 hover:bg-surface">
            <X className="h-4 w-4" />
          </button>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-pink-soft text-pink" aria-hidden>
            <copy.icon className="h-5 w-5" />
          </span>
          <p id="signup-nudge-title" className="mt-3 pr-8 font-display text-[20px] font-medium">
            {copy.title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink/60">{copy.body}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/auth?next=${encodeURIComponent(pathname || "/discover")}`} onClick={closeSignupNudge} className="btn-primary">
              Create free account
            </Link>
            <button onClick={closeSignupNudge} className="btn-ghost">
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
