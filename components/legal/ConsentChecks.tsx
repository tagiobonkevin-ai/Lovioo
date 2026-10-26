"use client";

import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** The two required agreements. Marketing emails and analytics are asked separately (Profile → Privacy choices, analytics bar). */
export interface ConsentChoices {
  terms: boolean;
  privacy: boolean;
}

export const NO_CHOICES: ConsentChoices = { terms: false, privacy: false };
export const requiredMissing = (c: ConsentChoices) =>
  !c.terms ? "Tick the box to agree to the Terms & Conditions." : !c.privacy ? "Tick the box to confirm you've read the Privacy Policy." : null;

const Doc = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    target="_blank"
    className="inline-flex items-baseline gap-0.5 font-medium text-ink underline decoration-midnight/30 decoration-dotted underline-offset-4 hover:text-pink hover:decoration-pink"
  >
    {children}
    <ArrowUpRight className="h-3 w-3 shrink-0 self-center" aria-label="(opens in a new tab)" />
  </Link>
);

const ITEMS: { key: keyof ConsentChoices; tag: string; body: React.ReactNode }[] = [
  {
    key: "terms",
    tag: "Required:",
    body: (
      <>
        I agree to the Lovioo <Doc href="/terms">Terms &amp; Conditions</Doc>.
      </>
    ),
  },
  {
    key: "privacy",
    tag: "Required acknowledgement:",
    body: (
      <>
        I have read the <Doc href="/privacy">Privacy Policy</Doc>, which explains how Lovioo processes my personal information.
      </>
    ),
  },
];

/** The two required sign-up agreements, each a real checkbox styled as a circle. */
export function ConsentChecks({ value, onChange, showErrors }: { value: ConsentChoices; onChange: (v: ConsentChoices) => void; showErrors?: boolean }) {
  return (
    <fieldset className="space-y-3.5">
      <legend className="sr-only">Agreements and choices</legend>
      {ITEMS.map(({ key, tag, body }) => {
        const missing = showErrors && !value[key];
        return (
          <label key={key} className="flex cursor-pointer items-start gap-3 text-[13px] leading-snug text-ink/80">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={value[key]}
              onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
              aria-required
              aria-invalid={missing || undefined}
            />
            <span
              aria-hidden
              className={cn(
                "mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 bg-white transition peer-focus-visible:ring-4 peer-focus-visible:ring-pink/20",
                value[key] ? "border-pink bg-pink text-white" : missing ? "border-coral" : "border-ink/15",
              )}
            >
              {value[key] && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
            <span>
              <b className="font-semibold text-ink">{tag}</b> {body}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
