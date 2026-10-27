"use client";

import { create } from "zustand";
import type { Gender } from "@/lib/supabase/database.types";

export interface AboutYou {
  fullName: string;
  birthdate: string | null;
  gender: Gender | null;
  city: string;
  province: string;
}

/** Which alerts a shopper asked for. Saved on their profile; nothing sends them yet. */
export interface NotifyChoices {
  drops: boolean;
  restock: boolean;
  digest: boolean;
}

export const NO_NOTIFY: NotifyChoices = { drops: false, restock: false, digest: false };

/** The three switches, in the order Profile shows them. */
export const NOTIFY_ROWS: { id: keyof NotifyChoices; label: string }[] = [
  { id: "drops", label: "Price drop alerts" },
  { id: "restock", label: "Back-in-stock alerts" },
  { id: "digest", label: "Weekly deals digest from Lovioo AI" },
];

/**
 * One switch as a profiles patch. Spelled out per key rather than built from a computed name, so the
 * column names stay literal types and a typo can't slip past the Supabase types.
 */
export const notifyPatch = (k: keyof NotifyChoices, value: boolean) =>
  k === "drops" ? { notify_drops: value } : k === "restock" ? { notify_restock: value } : { notify_digest: value };

interface ProfileStatus {
  /** Signed in, but name + birthday haven't been filled in yet (set after sign-in sync). */
  needsProfile: boolean;
  avatarUrl: string | null;
  /** An admin approved the name, so only the Lovioo team can change it now. */
  nameLocked: boolean;
  notify: NotifyChoices;
}

export const useProfileStatus = create<ProfileStatus>(() => ({ needsProfile: false, avatarUrl: null, nameLocked: false, notify: NO_NOTIFY }));

export const GENDERS: { id: Gender; label: string }[] = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "nonbinary", label: "Non-binary" },
  { id: "prefer_not_to_say", label: "Prefer not to say" },
];

export const MIN_AGE = 18;

/** Age in whole years on today's date, from a YYYY-MM-DD birthday. */
export function ageOn(birthdate: string, today = new Date()) {
  const [y, m, d] = birthdate.split("-").map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}

// Demo mode has no database: keep "About you" on this device.
const DEMO_KEY = "lovioo-about";
export function readDemoAbout(): AboutYou | null {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY) ?? "null");
  } catch {
    return null;
  }
}
export function writeDemoAbout(a: AboutYou) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(a));
  } catch {
    /* storage unavailable */
  }
}

/** Pages a signed-in user can open before finishing their profile. */
export const PROFILE_FREE_PATHS = ["/onboarding", "/auth", "/admin", "/terms", "/privacy", "/affiliate-disclosure", "/cookies"];
