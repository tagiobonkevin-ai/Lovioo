"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Supabase } from "@/lib/supabase/client";
import { CONSENT_VERSION } from "@/lib/site";

/** Choices made on the sign-up form that still have to be saved to the account (Google sign-up, email confirmation). */
export interface PendingConsent {
  marketing: boolean;
  analytics: boolean;
  version: string;
}

interface ConsentState {
  /** Non-essential analytics: null until the visitor decides. */
  analytics: boolean | null;
  marketing: boolean;
  pending: PendingConsent | null;
  ready: boolean;
  /** Signed in, but the account hasn't accepted the current Terms and Privacy Policy. */
  needsSheet: boolean;
  /** The analytics bar, opened by the "Privacy choices" link even after a decision. */
  barOpen: boolean;
  /** "Decide later": hidden for the rest of this visit. */
  dismissed: boolean;
  setAnalytics: (on: boolean) => void;
  setChoices: (c: { analytics: boolean; marketing: boolean }) => void;
  setPending: (p: PendingConsent | null) => void;
}

export const useConsent = create<ConsentState>()(
  persist(
    (set) => ({
      analytics: null,
      marketing: false,
      pending: null,
      ready: false,
      needsSheet: false,
      barOpen: false,
      dismissed: false,
      setAnalytics: (analytics) => set({ analytics, barOpen: false }),
      setChoices: ({ analytics, marketing }) => set({ analytics, marketing, barOpen: false }),
      setPending: (pending) => set({ pending }),
    }),
    {
      name: "lovioo-consent",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ analytics: s.analytics, marketing: s.marketing, pending: s.pending }),
      skipHydration: true,
    },
  ),
);

/** Loads the saved choices; call once in the browser. */
export function hydrateConsent() {
  const done = () => useConsent.setState({ ready: true });
  const p = useConsent.persist.rehydrate();
  if (p && "then" in p) p.then(done, done);
  else done();
}

/** Analytics (Vercel Web Analytics and Lovioo's own product view/click counts) only run after a yes. */
export function canTrack() {
  const s = useConsent.getState();
  if (s.ready) return s.analytics === true;
  // Before the store has loaded (a page's first effects run before the providers'), read the saved choice directly.
  try {
    return JSON.parse(localStorage.getItem("lovioo-consent") ?? "{}")?.state?.analytics === true;
  } catch {
    return false;
  }
}

export const openPrivacyChoices = () => useConsent.setState({ barOpen: true });

type ProfileConsent = { terms_accepted_at: string | null; terms_version: string | null; marketing_opt_in: boolean; analytics_opt_in: boolean };

/**
 * After sign-in: the account's choices win over this device's. Choices ticked on the sign-up form (Google, or an email
 * sign-up whose metadata didn't reach the profile) are saved now; otherwise the consent sheet asks.
 */
export async function syncConsent(sb: Supabase, p: ProfileConsent) {
  const { pending, setChoices } = useConsent.getState();
  if (p.terms_accepted_at && p.terms_version === CONSENT_VERSION) {
    setChoices({ analytics: p.analytics_opt_in, marketing: p.marketing_opt_in });
    useConsent.setState({ needsSheet: false, pending: null });
    return;
  }
  if (pending && pending.version === CONSENT_VERSION) {
    const { error } = await saveConsents(sb, { terms: true, privacy: true, marketing: pending.marketing, analytics: pending.analytics, source: "consent_sheet" });
    if (!error) {
      setChoices({ analytics: pending.analytics, marketing: pending.marketing });
      useConsent.setState({ needsSheet: false, pending: null });
      return;
    }
  }
  useConsent.setState({ needsSheet: true });
}

export function saveConsents(
  sb: Supabase,
  c: { terms?: boolean; privacy?: boolean; marketing?: boolean; analytics?: boolean; source: "consent_sheet" | "settings" },
) {
  return sb.rpc("set_my_consents", {
    terms: c.terms,
    privacy: c.privacy,
    marketing: c.marketing,
    analytics: c.analytics,
    version: CONSENT_VERSION,
    source: c.source,
  });
}

export const resetConsentSession = () => useConsent.setState({ needsSheet: false });
