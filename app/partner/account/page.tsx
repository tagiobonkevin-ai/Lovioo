"use client";

import { KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/Providers";
import { Field, PageHeader, Panel, adminInput } from "@/components/admin/ui";
import { usePartner } from "@/components/partner/PartnerShell";
import { CONTACT_EMAIL } from "@/lib/site";
import { getSupabase } from "@/lib/supabase/client";

/** Brand details (managed by Lovioo) and the partner's own password. */
export default function PartnerAccount() {
  const { brand, email } = usePartner();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  const change = async () => {
    setProblem("");
    if (pw.length < 10) return setProblem("Use at least 10 characters.");
    if (pw !== pw2) return setProblem("The two passwords don't match.");
    setBusy(true);
    const { error } = (await getSupabase()?.auth.updateUser({ password: pw })) ?? { error: null };
    setBusy(false);
    if (error) return setProblem(error.message);
    setPw("");
    setPw2("");
    toast({ title: "Password changed", body: "Use your new password next time you sign in.", kind: "ok" });
  };

  return (
    <div>
      <PageHeader title="Account" sub="Your brand details and your sign-in." />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <Panel title="Brand">
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">Brand</dt>
              <dd className="font-semibold">{brand.name}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">Tagline</dt>
              <dd>{brand.tagline || "—"}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">Official store link</dt>
              <dd className="break-all">{brand.store_url || "—"}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">Status</dt>
              <dd>{brand.is_partner ? "✅ Lovioo Brand Partner" : "Set-up in progress"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-ink/55">
            To change your logo, cover photo, tagline or store link, email <b>{CONTACT_EMAIL}</b>.
          </p>
        </Panel>
        <Panel title="Change password">
          <p className="-mt-1 mb-3 text-xs text-ink/55">Signed in as {email}. Please change the password Lovioo gave you.</p>
          <div className="grid gap-3">
            <Field label="New password">
              <input type="password" autoComplete="new-password" className={adminInput} value={pw} onChange={(e) => setPw(e.target.value)} />
            </Field>
            <Field label="Repeat new password">
              <input type="password" autoComplete="new-password" className={adminInput} value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </Field>
            {problem && <p className="text-sm text-coral">{problem}</p>}
            <button onClick={change} disabled={busy} className="btn-primary !py-2.5">
              <KeyRound className="h-4 w-4" /> Change password
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
