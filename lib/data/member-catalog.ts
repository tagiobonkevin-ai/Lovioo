"use client";

import { create } from "zustand";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { applyCatalog } from "./catalog";
import { fetchCatalog } from "./fetch-catalog";
import { BRANDS, PRODUCTS } from "./products";

type Status = "idle" | "loading" | "ready" | "error";

/** Products and prices are members-only: loaded in the browser with the signed-in session. Demo mode has them built in. */
export const useMemberCatalog = create<{ status: Status; error: string | null }>(() => ({
  status: isSupabaseConfigured ? "idle" : "ready",
  error: null,
}));

let loadingFor: string | null = null;

/** Loads products, offers and price stats for this visitor: `null` for a guest, else the user id (call again to retry). */
export async function loadMemberCatalog(userId: string | null) {
  const sb = getSupabase();
  if (!sb) return;
  const key = userId ?? "guest";
  loadingFor = key;
  useMemberCatalog.setState({ status: "loading", error: null });
  try {
    const catalog = await fetchCatalog(sb, { products: true });
    if (loadingFor !== key) return;
    applyCatalog(catalog);
    useMemberCatalog.setState({ status: "ready" });
  } catch (e) {
    if (loadingFor !== key) return;
    useMemberCatalog.setState({ status: "error", error: e instanceof Error ? e.message : String(e) });
  }
}

/** Forgets the products and prices when the user signs out. */
export function clearMemberCatalog() {
  if (!isSupabaseConfigured) return;
  loadingFor = null;
  PRODUCTS.splice(0, PRODUCTS.length);
  BRANDS.splice(0, BRANDS.length);
  useMemberCatalog.setState({ status: "idle", error: null });
}
