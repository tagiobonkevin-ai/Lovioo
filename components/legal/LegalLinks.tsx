"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { openPrivacyChoices } from "@/lib/consent";
import { LEGAL_PAGES } from "@/lib/site";
import { useLovioo } from "@/lib/store";
import { cn } from "@/lib/utils";

// Small print, but the padding keeps each link a comfortable thumb target on a phone.
const link =
  "inline-flex min-h-[32px] items-center rounded px-1.5 transition hover:text-pink focus-visible:text-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink/40";

/** The small row of legal links every page carries. "Privacy choices" opens the profile settings or the analytics bar. */
export function LegalLinks({ className, light }: { className?: string; light?: boolean }) {
  const router = useRouter();
  const signedIn = useLovioo((s) => !!s.user);
  return (
    <nav aria-label="Legal" className={cn("flex flex-wrap items-center justify-center gap-x-0.5 text-[11px] leading-none", light ? "text-white/45" : "text-midnight/45", className)}>
      {LEGAL_PAGES.map((p) => (
        <span key={p.href} className="flex items-center gap-x-1">
          <Link href={p.href} className={link}>
            {p.label}
          </Link>
          <span aria-hidden>·</span>
        </span>
      ))}
      <button type="button" onClick={() => (signedIn ? router.push("/profile#privacy-choices") : openPrivacyChoices())} className={link}>
        Privacy choices
      </button>
    </nav>
  );
}

/** A slim footer for pages without one of their own. */
export function LegalFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-12 border-t border-line/60 pt-4", className)}>
      <LegalLinks />
      <p className="mt-2 text-center text-[10px] text-midnight/35">© {new Date().getFullYear()} Lovioo · Prices and availability are set by each retailer and may change.</p>
    </footer>
  );
}
