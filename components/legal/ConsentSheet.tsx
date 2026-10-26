"use client";

import { Analytics } from "@vercel/analytics/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "@/components/Providers";
import { ConsentChecks, NO_CHOICES, requiredMissing, type ConsentChoices } from "@/components/legal/ConsentChecks";
import { saveConsents, useConsent } from "@/lib/consent";
import { useLovioo } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";

/**
 * Signed-in accounts that haven't accepted the current Terms and Privacy Policy (older accounts, Google sign-ups) see this
 * once. The required boxes must be ticked to continue; signing out is the only other way out.
 */
export function ConsentSheet() {
  const open = useConsent((s) => s.needsSheet);
  const signOut = useLovioo((s) => s.signOut);
  const [choices, setChoices] = useState<ConsentChoices>(NO_CHOICES);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const missing = requiredMissing(choices);

  const accept = async () => {
    setTried(true);
    const sb = getSupabase();
    if (missing || !sb) return;
    setBusy(true);
    const { error } = await saveConsents(sb, { ...choices, source: "consent_sheet" });
    setBusy(false);
    if (error) return toast({ title: "Couldn't save your choices", body: error.message, kind: "error" });
    useConsent.setState({ needsSheet: false, pending: null });
    toast({ title: "Thanks — you're all set", kind: "ok" });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-end justify-center bg-midnight/50 p-0 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-title"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
          >
            <h2 id="consent-title" className="text-center text-xl font-extrabold">
              Welcome to Lovioo 💗
            </h2>
            <p className="mt-1 text-center text-sm text-midnight/60">Before you continue, please review and accept our terms.</p>
            <hr className="my-5 border-line" />
            <ConsentChecks value={choices} onChange={setChoices} showErrors={tried} />
            {tried && missing && <p className="mt-3 text-xs font-medium text-coral">{missing}</p>}
            <button onClick={accept} disabled={busy} className="btn-primary mt-5 w-full !py-3" aria-disabled={!!missing}>
              {busy ? "Saving…" : "Continue"}
            </button>
            <button
              onClick={async () => {
                await getSupabase()?.auth.signOut();
                signOut();
                useConsent.setState({ needsSheet: false });
              }}
              className="mt-3 w-full text-center text-xs font-semibold text-midnight/50 hover:text-pink"
            >
              Sign out instead
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Vercel Web Analytics, loaded only after the visitor allows analytics. */
export function ConsentedAnalytics() {
  const allowed = useConsent((s) => s.ready && s.analytics === true);
  return allowed ? <Analytics /> : null;
}
