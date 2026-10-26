import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Without these env vars the app runs in demo mode on the built-in catalog and keeps user data in the browser. */
export const isSupabaseConfigured = Boolean(url && key);

export type Supabase = SupabaseClient<Database>;

let browserClient: Supabase | null = null;

/** Shared browser client (persists the auth session). Returns null in demo mode. */
export function getSupabase(): Supabase | null {
  if (!isSupabaseConfigured) return null;
  if (typeof window === "undefined") return createServerClient();
  browserClient ??= createClient<Database>(url!, key!);
  return browserClient;
}

/**
 * Whether a sign-in provider (e.g. "google") is switched on in Supabase Auth, from its public settings endpoint.
 * Lets the app hide a provider button instead of sending people to Supabase's "provider is not enabled" error.
 */
export async function isAuthProviderEnabled(provider: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key! } });
    if (!res.ok) return true;
    const settings = (await res.json()) as { external?: Record<string, boolean> };
    return settings.external?.[provider] === true;
  } catch {
    // Can't tell: keep the button; Supabase reports the problem if there is one.
    return true;
  }
}

/** Stateless client for server rendering: anonymous, so it only sees public catalog rows. */
export function createServerClient(): Supabase | null {
  if (!isSupabaseConfigured) return null;
  return createClient<Database>(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
}
