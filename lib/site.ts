/** Public site settings in one place. Change these when the custom domain and support inbox are ready. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://lovioo-kevin-2313.vercel.app").replace(/\/$/, "");
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "kevin@cleons.net";
export const LEGAL_UPDATED = "October 25, 2026";
