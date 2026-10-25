"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { isPriced, productById } from "@/lib/data/products";
import { getInsight } from "@/lib/insights";
import type { PriceAlert, Preferences } from "@/lib/types";

export interface User {
  /** Supabase user id; absent for demo-mode accounts. */
  id?: string;
  name: string;
  email: string;
}

export type SwipeAction = "love" | "nope" | "super";

export interface SwipeRecord {
  productId: string;
  action: SwipeAction;
  at: number;
}

interface LoviooState {
  user: User | null;
  onboarded: boolean;
  prefs: Preferences;
  saved: string[];
  alerts: PriceAlert[];
  swipes: SwipeRecord[];
  compare: string[];
  streakDay: string | null;
  streak: number;
  dailyGoal: number;

  signIn: (u: User) => void;
  signOut: () => void;
  setPrefs: (p: Partial<Preferences>) => void;
  completeOnboarding: () => void;
  toggleSave: (id: string) => boolean;
  save: (id: string) => void;
  setAlert: (id: string, targetPrice?: number) => void;
  toggleAlert: (id: string) => void;
  removeAlert: (id: string) => void;
  recordSwipe: (id: string, action: SwipeAction) => void;
  undoSwipe: () => SwipeRecord | undefined;
  resetSwipes: () => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  /** Replaces the signed-in user's personal data (used when loading it from Supabase). */
  loadUserData: (d: Pick<LoviooState, "saved" | "alerts" | "swipes" | "prefs" | "onboarded" | "streak" | "streakDay">) => void;
}

const todayKey = () => new Date().toISOString().slice(0, 10);

export const useLovioo = create<LoviooState>()(
  persist(
    (set, get) => ({
      user: null,
      onboarded: false,
      prefs: { interests: [], budget: null, platforms: ["shopee", "lazada", "tiktok", "amazon"] },
      saved: [],
      alerts: [],
      swipes: [],
      compare: [],
      streakDay: null,
      streak: 0,
      dailyGoal: 20,

      signIn: (user) => set({ user }),
      // Signing out clears personal data so the next person on this browser starts fresh.
      signOut: () => set({ user: null, saved: [], alerts: [], swipes: [], streak: 0, streakDay: null, onboarded: false }),
      setPrefs: (p) => set({ prefs: { ...get().prefs, ...p } }),
      completeOnboarding: () => set({ onboarded: true }),

      toggleSave: (id) => {
        const has = get().saved.includes(id);
        set({ saved: has ? get().saved.filter((x) => x !== id) : [id, ...get().saved] });
        return !has;
      },
      save: (id) => {
        if (!get().saved.includes(id)) set({ saved: [id, ...get().saved] });
      },
      setAlert: (id, targetPrice) => {
        const p = productById(id);
        // "See prices" picks have no price to watch.
        if (!p || !isPriced(p)) return;
        const target = targetPrice ?? Math.round(getInsight(p).lowest90);
        const rest = get().alerts.filter((a) => a.productId !== id);
        set({ alerts: [{ productId: id, targetPrice: target, enabled: true, createdAt: Date.now() }, ...rest] });
      },
      toggleAlert: (id) =>
        set({ alerts: get().alerts.map((a) => (a.productId === id ? { ...a, enabled: !a.enabled } : a)) }),
      removeAlert: (id) => set({ alerts: get().alerts.filter((a) => a.productId !== id) }),

      recordSwipe: (id, action) => {
        const today = todayKey();
        const { streakDay, streak } = get();
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
        const nextStreak = streakDay === today ? streak : streakDay === yesterday ? streak + 1 : 1;
        set({ swipes: [...get().swipes, { productId: id, action, at: Date.now() }], streakDay: today, streak: nextStreak });
        if (action !== "nope") get().save(id);
        if (action === "super") get().setAlert(id);
      },
      undoSwipe: () => {
        const swipes = get().swipes;
        const last = swipes[swipes.length - 1];
        if (!last) return undefined;
        set({ swipes: swipes.slice(0, -1) });
        if (last.action !== "nope") set({ saved: get().saved.filter((x) => x !== last.productId) });
        if (last.action === "super") get().removeAlert(last.productId);
        return last;
      },
      resetSwipes: () => set({ swipes: [] }),

      toggleCompare: (id) => {
        const c = get().compare;
        if (c.includes(id)) set({ compare: c.filter((x) => x !== id) });
        else set({ compare: [...c, id].slice(-3) });
      },
      clearCompare: () => set({ compare: [] }),
      loadUserData: (d) => set(d),
    }),
    {
      name: "lovioo-store",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

export const swipesToday = (swipes: SwipeRecord[]) => {
  const t = todayKey();
  return swipes.filter((s) => new Date(s.at).toISOString().slice(0, 10) === t).length;
};
