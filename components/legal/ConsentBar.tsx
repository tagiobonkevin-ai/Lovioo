"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "@/components/Providers";
import { openPrivacyChoices, saveConsents, useConsent } from "@/lib/consent";
import { useLovioo } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";

// Pages where the bar would get in the way: sign-up has its own checkboxes, the documents explain the choice.
const QUIET = ["/auth", "/admin", "/onboarding", "/terms", "/privacy", "/affiliate-disclosure", "/cookies"];

/** True while the analytics bar is on screen; other bottom prompts wait for it. */
export function useConsentBarVisible() {
  const pathname = usePathname();
  const { ready, analytics, barOpen, needsSheet, dismissed } = useConsent();
  const signedIn = useLovioo((s) => !!s.user);
  if (!ready || needsSheet) return false;
  if (barOpen) return true;
  return analytics === null && !dismissed && !signedIn && !QUIET.some((p) => pathname.startsWith(p));
}

/** A small bottom bar asking signed-out visitors about analytics. Nothing non-essential runs until they answer yes. */
export function ConsentBar() {
  const visible = useConsentBarVisible();
  const setAnalytics = useConsent((s) => s.setAnalytics);
  const user = useLovioo((s) => s.user);

  const choose = async (on: boolean) => {
    setAnalytics(on);
    const sb = getSupabase();
    // Signed in (opened from "Privacy choices"): keep the account in step.
    if (sb && user?.id) {
      const { error } = await saveConsents(sb, { analytics: on, source: "settings" });
      if (error) toast({ title: "Couldn't save your choice", body: error.message, kind: "error" });
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          role="region"
          aria-label="Analytics choice"
          className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-xl rounded-2xl bg-midnight p-3 pr-10 text-white shadow-2xl md:bottom-6"
        >
          <button
            onClick={() => useConsent.setState({ barOpen: false, dismissed: true })}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-white/50 hover:text-white"
            aria-label="Decide later"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <BarChart3 className="hidden h-5 w-5 shrink-0 text-pink-soft sm:block" />
            <p className="min-w-0 flex-1 text-xs leading-snug text-white/80">
              <b className="text-white">Help improve Lovioo?</b> Allow analytics of the pages and products you view. No advertising trackers.{" "}
              <Link href="/cookies" className="whitespace-nowrap font-semibold text-pink-soft underline underline-offset-2">
                Cookie &amp; Tracking Notice
              </Link>
            </p>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => choose(false)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/80 ring-1 ring-white/25 hover:bg-white/10">
                No thanks
              </button>
              <button onClick={() => choose(true)} className="rounded-full bg-pink px-3.5 py-1.5 text-xs font-bold text-white shadow-pop hover:brightness-110">
                Allow
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** "Privacy choices" button for the Cookie notice page. */
export function PrivacyChoicesButton() {
  const analytics = useConsent((s) => s.analytics);
  return (
    <button onClick={openPrivacyChoices} className="btn-ghost !py-2 text-sm">
      Privacy choices · analytics {analytics === true ? "on" : analytics === false ? "off" : "not set"}
    </button>
  );
}
