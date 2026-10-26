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

interface ProfileStatus {
  /** Signed in, but name + birthday haven't been filled in yet (set after sign-in sync). */
  needsProfile: boolean;
  avatarUrl: string | null;
}

export const useProfileStatus = create<ProfileStatus>(() => ({ needsProfile: false, avatarUrl: null }));

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
