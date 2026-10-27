"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { LegalLinks } from "@/components/legal/LegalLinks";

/**
 * A shopper page that threw. This sits inside the app shell, so the header and tab bar stay put and the
 * shopper can navigate away instead of staring at a blank screen.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Lovioo app error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl" aria-hidden>
        🧺
      </p>
      <h1 className="mt-4 font-display text-[24px] font-medium leading-[1.4] tracking-[-0.009em]">That didn&apos;t load</h1>
      <p className="mx-auto mt-2 max-w-[38ch] text-sm text-ink/60">
        Something went wrong on our side, not yours. Try again — your saves and swipes are safe.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="inline-flex h-11 items-center gap-2 bg-ink px-6 text-sm font-medium text-white transition hover:opacity-85">
          <RotateCcw className="h-4 w-4" aria-hidden /> Try again
        </button>
        <Link href="/discover" className="inline-flex h-11 items-center border border-ink/20 px-6 text-sm font-medium text-ink/70 transition hover:border-ink/50 hover:text-ink">
          Back to Discover
        </Link>
      </div>
      {error.digest && <p className="mt-6 text-[11px] text-ink/35">Reference: {error.digest}</p>}
      <LegalLinks className="mt-10" />
    </div>
  );
}
