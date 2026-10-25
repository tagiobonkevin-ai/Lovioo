"use client";

import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "@/components/Providers";
import { saveConsents, useConsent } from "@/lib/consent";
import { LEGAL_PAGES } from "@/lib/site";
import { useLovioo } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Profile → Privacy choices: marketing emails and analytics, changeable any time without deleting the account. */
export function PrivacyChoices() {
  const user = useLovioo((s) => s.user);
  const { analytics, marketing, setChoices } = useConsent();
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !user?.id) return;
    sb.from("profiles")
      .select("terms_accepted_at")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setAcceptedAt(data?.terms_accepted_at ?? null));
  }, [user?.id]);

  const change = async (key: "marketing" | "analytics", on: boolean) => {
    const before = { analytics: analytics === true, marketing };
    setChoices({ ...before, [key]: on });
    const sb = getSupabase();
    if (!sb || !user?.id) return;
    setBusy(key);
    const { error } = await saveConsents(sb, { [key]: on, source: "settings" });
    setBusy(null);
    if (error) {
      setChoices(before);
      toast({ title: "Couldn't save your choice", body: error.message, kind: "error" });
    } else toast({ title: "Privacy choice saved", kind: "ok" });
  };

  const rows = [
    { key: "marketing" as const, label: "Email me product discoveries, deals and launch updates", on: marketing },
    { key: "analytics" as const, label: "Allow analytics (Vercel Web Analytics and product view/click counts)", on: analytics === true },
  ];

  return (
    <section id="privacy-choices" className="card scroll-mt-24 p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-pink/10 text-pink">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold">Privacy choices</h2>
          <p className="text-xs text-midnight/50">Change these any time. Saved to your account.</p>
        </div>
      </div>
      {rows.map((r) => (
        <div key={r.key} className="flex items-center justify-between gap-4 border-b border-line/70 py-3 last:border-0">
          <span className="text-sm">{r.label}</span>
          <button
            role="switch"
            aria-checked={r.on}
            aria-label={r.label}
            disabled={busy === r.key}
            onClick={() => change(r.key, !r.on)}
            className={cn("relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60", r.on ? "bg-pink" : "bg-line")}
          >
            <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", r.on ? "left-6" : "left-1")} />
          </button>
        </div>
      ))}
      <p className="mt-3 text-[11px] text-midnight/45">
        {acceptedAt ? `You accepted the Terms and Privacy Policy on ${new Date(acceptedAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}. ` : ""}
        Lovioo doesn&apos;t send marketing emails yet; your choice is kept for when it does.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {LEGAL_PAGES.map((p) => (
          <Link key={p.href} href={p.href} className="chip !py-1 text-[11px]">
            {p.label} <ArrowUpRight className="h-3 w-3" />
          </Link>
        ))}
      </div>
    </section>
  );
}
