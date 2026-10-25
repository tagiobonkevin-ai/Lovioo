/**
 * Only same-site paths are allowed after sign-in, so a link like /auth?next=https://evil.example
 * can't bounce someone off Lovioo. Anything else falls back to the given default.
 */
export function safeNext(next: string | null | undefined, fallback = "/discover") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  // Reject control characters, which browsers strip before parsing (e.g. "/\t/evil.example").
  return /[\u0000-\u001f\u007f]/.test(next) ? fallback : next;
}
