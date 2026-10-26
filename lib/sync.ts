"use client";

import { canTrack } from "@/lib/consent";
import { PRODUCTS, productById } from "@/lib/data/products";
import { useLovioo, type SwipeRecord } from "@/lib/store";
import type { Supabase } from "@/lib/supabase/client";
import type { PriceAlert, Preferences } from "@/lib/types";

type State = ReturnType<typeof useLovioo.getState>;

let applyingRemote = false;

const swipeKey = (s: SwipeRecord) => `${s.productId}@${s.at}`;

/**
 * On sign-in: load the user's data from Supabase and merge in anything they did as a guest
 * on this browser (saves, alerts, swipes), pushing the guest-only items up.
 */
export async function pullAndMerge(sb: Supabase, userId: string, onError: (msg: string) => void) {
  const [profile, saved, alerts, swipes] = await Promise.all([
    sb.from("profiles").select("*").eq("id", userId).single(),
    sb.from("saved_items").select("product_id, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    sb.from("price_alerts").select("*").eq("user_id", userId),
    sb.from("swipes").select("product_id, action, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(500),
  ]);
  const error = profile.error ?? saved.error ?? alerts.error ?? swipes.error;
  if (error || !profile.data || !saved.data || !alerts.data || !swipes.data) return onError(error?.message ?? "No account data returned");
  const p = profile.data;

  const local = useLovioo.getState();
  // If the members-only catalog couldn't load, keep everything rather than dropping saves for "unknown" products.
  const catalogLoaded = PRODUCTS.length > 0;
  const known = (id: string) => !catalogLoaded || !!productById(id);

  const remoteSaved = saved.data.map((r) => r.product_id);
  const localOnlySaved = local.saved.filter((id) => !remoteSaved.includes(id) && known(id));

  const remoteAlerts: PriceAlert[] = alerts.data.map((a) => ({
    productId: a.product_id,
    targetPrice: a.target_price,
    enabled: a.enabled,
    createdAt: Date.parse(a.created_at),
  }));
  const localOnlyAlerts = local.alerts.filter((a) => !remoteAlerts.some((r) => r.productId === a.productId) && known(a.productId));

  const remoteSwipes: SwipeRecord[] = swipes.data
    .map((s) => ({ productId: s.product_id, action: s.action as SwipeRecord["action"], at: Date.parse(s.created_at) }))
    .reverse();
  const remoteKeys = new Set(remoteSwipes.map(swipeKey));
  const localOnlySwipes = local.swipes.filter((s) => !remoteKeys.has(swipeKey(s)) && known(s.productId));

  // Someone who onboarded before, keeps their saved preferences; a brand-new account adopts what they picked as a guest.
  const prefs: Preferences = p.onboarded
    ? { interests: p.interests, budget: p.budget as Preferences["budget"], platforms: p.platforms }
    : local.prefs;
  const onboarded = p.onboarded || local.onboarded;
  const streak = Math.max(p.streak, local.streak);
  const streakDay = [p.streak_day, local.streakDay].filter(Boolean).sort().pop() ?? null;

  const pushes = [
    localOnlySaved.length && sb.from("saved_items").upsert(localOnlySaved.map((product_id) => ({ user_id: userId, product_id }))),
    localOnlyAlerts.length &&
      sb.from("price_alerts").upsert(localOnlyAlerts.map((a) => ({ user_id: userId, product_id: a.productId, target_price: a.targetPrice, enabled: a.enabled }))),
    localOnlySwipes.length &&
      sb.from("swipes").insert(localOnlySwipes.map((s) => ({ user_id: userId, product_id: s.productId, action: s.action, created_at: new Date(s.at).toISOString() }))),
    !p.onboarded && onboarded && sb.from("profiles").update(profilePatch({ prefs, onboarded, streak, streakDay })).eq("id", userId),
  ].filter(Boolean);
  const results = await Promise.all(pushes);
  const pushError = results.find((r) => r && "error" in r && r.error);
  if (pushError && "error" in pushError && pushError.error) onError(pushError.error.message);

  applyingRemote = true;
  try {
    local.loadUserData({
      saved: [...localOnlySaved, ...remoteSaved].filter(known),
      alerts: [...localOnlyAlerts, ...remoteAlerts].filter((a) => known(a.productId)),
      swipes: [...remoteSwipes, ...localOnlySwipes].sort((a, b) => a.at - b.at),
      prefs,
      onboarded,
      streak,
      streakDay,
    });
  } finally {
    applyingRemote = false;
  }
  return { fullName: p.full_name, consent: p, profileComplete: !!p.profile_completed_at, avatarUrl: p.avatar_url, nameLocked: !!p.name_approved_at };
}

function profilePatch(s: Pick<State, "prefs" | "onboarded" | "streak" | "streakDay">) {
  return {
    interests: s.prefs.interests,
    budget: s.prefs.budget,
    platforms: s.prefs.platforms,
    onboarded: s.onboarded,
    streak: s.streak,
    streak_day: s.streakDay,
  };
}

/** Mirrors every later change to the signed-in user's data into Supabase. Returns an unsubscribe function. */
export function startWriteThrough(sb: Supabase, userId: string, onError: (msg: string) => void) {
  const check = (p: PromiseLike<{ error: { message: string } | null }>) =>
    p.then(({ error }) => {
      if (error) onError(error.message);
    });
  let profileTimer: ReturnType<typeof setTimeout> | undefined;

  const unsubscribe = useLovioo.subscribe((next, prev) => {
    if (applyingRemote || next.user?.id !== userId || prev.user?.id !== userId) return;

    if (next.saved !== prev.saved) {
      const added = next.saved.filter((id) => !prev.saved.includes(id));
      const removed = prev.saved.filter((id) => !next.saved.includes(id));
      if (added.length) check(sb.from("saved_items").upsert(added.map((product_id) => ({ user_id: userId, product_id }))));
      if (removed.length) check(sb.from("saved_items").delete().eq("user_id", userId).in("product_id", removed));
    }

    if (next.alerts !== prev.alerts) {
      const changed = next.alerts.filter((a) => !prev.alerts.includes(a));
      const removed = prev.alerts.filter((a) => !next.alerts.some((n) => n.productId === a.productId));
      if (changed.length)
        check(
          sb
            .from("price_alerts")
            .upsert(changed.map((a) => ({ user_id: userId, product_id: a.productId, target_price: a.targetPrice, enabled: a.enabled }))),
        );
      if (removed.length) check(sb.from("price_alerts").delete().eq("user_id", userId).in("product_id", removed.map((a) => a.productId)));
    }

    if (next.swipes !== prev.swipes) {
      const nextKeys = new Set(next.swipes.map(swipeKey));
      const prevKeys = new Set(prev.swipes.map(swipeKey));
      const added = next.swipes.filter((s) => !prevKeys.has(swipeKey(s)));
      const undone = prev.swipes.filter((s) => !nextKeys.has(swipeKey(s)));
      if (added.length)
        check(sb.from("swipes").insert(added.map((s) => ({ user_id: userId, product_id: s.productId, action: s.action, created_at: new Date(s.at).toISOString() }))));
      if (next.swipes.length === 0 && prev.swipes.length > 1) check(sb.from("swipes").delete().eq("user_id", userId));
      else
        undone.forEach((s) =>
          check(sb.from("swipes").delete().eq("user_id", userId).eq("product_id", s.productId).eq("created_at", new Date(s.at).toISOString())),
        );
    }

    if (next.prefs !== prev.prefs || next.onboarded !== prev.onboarded || next.streak !== prev.streak || next.streakDay !== prev.streakDay) {
      clearTimeout(profileTimer);
      profileTimer = setTimeout(() => {
        check(sb.from("profiles").update(profilePatch(useLovioo.getState())).eq("id", userId));
      }, 600);
    }
  });

  return () => {
    clearTimeout(profileTimer);
    unsubscribe();
  };
}

/** Fire-and-forget analytics for the admin dashboard; only once the visitor has allowed analytics. */
export function trackEvent(sb: Supabase | null, productId: string, kind: "view" | "click_out", retailerId?: string) {
  if (!sb || !canTrack()) return;
  const userId = useLovioo.getState().user?.id ?? null;
  sb.from("product_events")
    .insert({ product_id: productId, kind, retailer_id: retailerId ?? null, user_id: userId })
    .then(({ error }) => {
      if (error) console.warn("Lovioo analytics:", error.message);
    });
}
