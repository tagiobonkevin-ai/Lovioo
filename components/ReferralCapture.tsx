"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLovioo } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";

const KEY = "lovioo-ref";
const SEEN = "lovioo-ref-seen";
const KEEP_MS = 7 * 86_400_000;
const BRAND = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const read = (store: Storage | undefined, key: string) => {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
};
const write = (store: Storage | undefined, key: string, value: string | null) => {
  try {
    if (value === null) store?.removeItem(key);
    else store?.setItem(key, value);
  } catch {
    /* private mode: referral simply isn't remembered */
  }
};

/**
 * Lovioo referral links: a Brand Partner puts `lovioo.shop/...?ref=<brand>` on their own website. A visit counts once
 * per browser session (no personal data is sent), and the brand is remembered on this device for 7 days so a new
 * sign-up can be credited to it. Only a brand marked as a partner counts; that check happens in the database.
 */
export function ReferralCapture() {
  const pathname = usePathname();
  const userId = useLovioo((s) => s.user?.id);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref")?.toLowerCase().trim();
    if (!ref || !BRAND.test(ref) || ref.length > 60) return;
    write(window.localStorage, KEY, JSON.stringify({ brand: ref, at: Date.now() }));
    const seen = `${SEEN}:${ref}`;
    if (read(window.sessionStorage, seen)) return;
    write(window.sessionStorage, seen, "1");
    getSupabase()
      ?.rpc("record_referral", { brand: ref, path: pathname.slice(0, 200) })
      .then(({ error }) => error && console.warn("Lovioo referral:", error.message));
  }, [pathname]);

  useEffect(() => {
    if (!userId) return;
    const raw = read(window.localStorage, KEY);
    if (!raw) return;
    let saved: { brand?: string; at?: number } = {};
    try {
      saved = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    write(window.localStorage, KEY, null);
    if (!saved.brand || !saved.at || Date.now() - saved.at > KEEP_MS) return;
    // The database only credits brand-new accounts, so signing in to an old account never counts as a referral.
    getSupabase()
      ?.rpc("claim_referral", { brand: saved.brand })
      .then(({ error }) => error && console.warn("Lovioo referral:", error.message));
  }, [userId]);

  return null;
}
