"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Logo } from "@/components/brand/Logo";
import { LegalLinks } from "@/components/legal/LegalLinks";

/**
 * Shown when a page throws instead of rendering. Without this, Next.js shows a blank white screen, which
 * tells the shopper nothing and gives them nowhere to go.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Lovioo page error:", error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center bg-brand-soft p-6 text-center">
      <div>
        <Logo tagline />
        <p className="mt-10 text-7xl" aria-hidden>
          🧺
        </p>
        <h1 className="mt-4 text-[30px] leading-[1.35]">That didn&apos;t load</h1>
        <p className="mx-auto mt-2 max-w-[40ch] text-ink/60">
          Something went wrong on our side, not yours. Try again — and if it keeps happening, let us know.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="btn-gradient inline-flex items-center gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden /> Try again
          </button>
          <Link href="/" className="inline-flex h-11 items-center border border-ink/20 px-6 text-sm font-medium text-ink/70 transition hover:border-ink/50 hover:text-ink">
            Go home
          </Link>
        </div>
        {error.digest && <p className="mt-6 text-[11px] text-ink/35">Reference: {error.digest}</p>}
        <LegalLinks className="mt-10" />
      </div>
    </div>
  );
}
