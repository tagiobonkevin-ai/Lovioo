"use client";

import { useEffect } from "react";
import { resetConsentSession, syncConsent } from "@/lib/consent";
import { clearMemberCatalog, loadMemberCatalog } from "@/lib/data/member-catalog";
import { useProfileStatus } from "@/lib/profile";
import { useLovioo } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { pullAndMerge, startWriteThrough } from "@/lib/sync";
import { toast, useHydrated } from "./Providers";

/** Keeps the local store in step with the Supabase session. Renders nothing; does nothing in demo mode. */
export function AuthSync() {
  const hydrated = useHydrated();

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !hydrated) return;
    let stopSync: (() => void) | undefined;
    let activeUserId: string | null = null;
    const onError = (msg: string) => {
      console.error("Lovioo sync:", msg);
      toast({ title: "Couldn't sync with your account", body: msg, kind: "error" });
    };

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (!u) {
        stopSync?.();
        activeUserId = null;
        resetConsentSession();
        clearMemberCatalog();
        useProfileStatus.setState({ needsProfile: false, avatarUrl: null });
        // Also clears a leftover demo-mode login or an expired session; guests (no user) keep their data.
        if (useLovioo.getState().user) useLovioo.getState().signOut();
        return;
      }
      if (u.id === activeUserId) return;
      activeUserId = u.id;
      stopSync?.();
      const meta = u.user_metadata ?? {};
      useLovioo.getState().signIn({ id: u.id, email: u.email ?? "", name: meta.full_name || meta.name || (u.email ?? "").split("@")[0] });
      // Defer Supabase calls out of the auth callback, as supabase-js recommends.
      setTimeout(async () => {
        // Products first: merging saves and alerts checks them against the (members-only) catalog.
        await loadMemberCatalog(u.id);
        if (activeUserId !== u.id) return;
        const res = await pullAndMerge(sb, u.id, onError);
        if (activeUserId !== u.id) return;
        if (res?.fullName) useLovioo.getState().signIn({ id: u.id, email: u.email ?? "", name: res.fullName });
        if (res) {
          useProfileStatus.setState({ needsProfile: !res.profileComplete, avatarUrl: res.avatarUrl });
          await syncConsent(sb, res.consent);
        }
        stopSync = startWriteThrough(sb, u.id, onError);
      }, 0);
    });

    return () => {
      sub.subscription.unsubscribe();
      stopSync?.();
    };
  }, [hydrated]);

  return null;
}
