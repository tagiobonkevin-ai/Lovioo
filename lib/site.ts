/** Public site settings in one place. The support inbox can be changed with NEXT_PUBLIC_CONTACT_EMAIL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://lovioo.shop").replace(/\/$/, "");
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "kevin@cleons.net";
export const LEGAL_UPDATED = "October 25, 2026";

// Legal details shown on the Terms, Privacy, Affiliate and Cookie pages. Fill in the operator and address when known.
export const LEGAL_OPERATOR = "To be confirmed";
export const LEGAL_ADDRESS = "To be confirmed";
export const LEGAL_EFFECTIVE = "October 25, 2026";
/** Bump when the Terms or Privacy Policy change materially: signed-in users are asked to accept again. */
export const CONSENT_VERSION = "2026-10-25";

export const LEGAL_PAGES = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
  { href: "/cookies", label: "Cookies & tracking" },
] as const;
