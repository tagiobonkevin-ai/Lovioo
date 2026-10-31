"use client";

import { Check, Copy, KeyRound, Link2, RefreshCw, UserMinus, UserPlus, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/Providers";
import { adminDb, saveWith, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, Field, PageHeader, Panel, Skeleton, Toggle, adminInput } from "@/components/admin/ui";
import { PartnerStatsView, type PartnerStats } from "@/components/partner/PartnerStatsView";
import { SITE_URL } from "@/lib/site";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** A readable random password (no 0/O/1/l look-alikes). */
function generatePassword(length = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

async function callPartnersApi(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string; code?: string }> {
  const { data } = (await getSupabase()?.auth.getSession()) ?? { data: { session: null } };
  const token = data.session?.access_token;
  if (!token) return { ok: false, error: "Your session expired. Sign in again." };
  try {
    const res = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { ok: false, error: json.error ?? `Request failed (${res.status})`, code: json.code };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

/** Admin -> Brand Partners: which brands are partners, their logins, and how their products are doing. */
export default function AdminPartners() {
  const brands = useAdminQuery((sb) => sb.from("brands").select("id, name, is_partner, published").order("name"));
  const members = useAdminQuery((sb) => sb.rpc("admin_partner_members"));
  const [statsBrand, setStatsBrand] = useState("");
  const [days, setDays] = useState(30);
  const stats = useAdminQuery(
    async (sb) => {
      if (!statsBrand) return { data: null, error: null };
      const res = await sb.rpc("partner_stats", { brand: statsBrand, days });
      return { data: res.data as unknown as PartnerStats | null, error: res.error };
    },
    [statsBrand, days],
  );

  // Create login
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);
  const [noKey, setNoKey] = useState(false);
  // Link existing
  const [linkEmail, setLinkEmail] = useState("");
  const [linkBrand, setLinkBrand] = useState("");

  const partnerBrands = (brands.data ?? []).filter((b) => b.is_partner || members.data?.some((m) => m.brand_id === b.id));
  const brandName = (id: string) => brands.data?.find((b) => b.id === id)?.name ?? id;

  const create = async () => {
    if (!brand) return toast({ title: "Pick a brand", kind: "error" });
    if (!email.trim()) return toast({ title: "Enter the partner's email", kind: "error" });
    if (password.length < 10) return toast({ title: "Use a password of at least 10 characters", kind: "error" });
    setBusy(true);
    const res = await callPartnersApi({ action: "create", brand, email: email.trim(), password, name: name.trim() });
    setBusy(false);
    if (!res.ok) {
      if (res.code === "no_service_key") setNoKey(true);
      return toast({ title: "Couldn't create the login", body: res.error, kind: "error" });
    }
    setIssued({ email: email.trim().toLowerCase(), password });
    setEmail("");
    setName("");
    setPassword("");
    toast({ title: `Login created for ${brandName(brand)}`, kind: "ok" });
    members.reload();
    brands.reload();
  };

  const link = async () => {
    if (!linkBrand || !linkEmail.trim()) return toast({ title: "Pick a brand and enter the email", kind: "error" });
    const res = await adminDb().rpc("admin_link_partner", { target_email: linkEmail.trim(), brand: linkBrand });
    if (await saveWith(Promise.resolve({ error: res.error }), `${linkEmail.trim()} can now manage ${brandName(linkBrand)}`)) {
      setLinkEmail("");
      members.reload();
      brands.reload();
    }
  };

  const reset = async (userId: string, who: string) => {
    const pw = generatePassword();
    if (!window.confirm(`Set a new password for ${who}? You'll see it once to send to them.`)) return;
    const res = await callPartnersApi({ action: "reset-password", userId, password: pw });
    if (!res.ok) {
      if (res.code === "no_service_key") setNoKey(true);
      return toast({ title: "Couldn't reset the password", body: res.error, kind: "error" });
    }
    setIssued({ email: who, password: pw });
  };

  const remove = async (userId: string, brandId: string, who: string) => {
    if (!window.confirm(`Remove ${who}'s access to ${brandName(brandId)}? Their account stays, they just can't manage this brand.`)) return;
    if (await saveWith(adminDb().from("brand_members").delete().eq("user_id", userId).eq("brand_id", brandId), "Access removed")) members.reload();
  };

  const togglePartner = async (id: string, on: boolean) => {
    if (await saveWith(adminDb().from("brands").update({ is_partner: on }).eq("id", id), on ? "Marked as Brand Partner" : "No longer a Brand Partner")) brands.reload();
  };

  return (
    <div>
      <PageHeader
        title="Brand Partners"
        sub="Give partner brands a login to add products (Lovioo approves them in the Review queue), get referral links and see how shoppers respond. Only mark a brand as a partner when there's a real agreement."
      />
      {(brands.error || members.error) && <ErrorNote message={brands.error ?? members.error ?? ""} />}
      {!brands.data && brands.loading && <Skeleton className="h-64" />}

      {issued && (
        <div className="mb-5 rounded-3xl bg-emerald-50 p-5 text-sm">
          <p className="font-bold text-emerald-800">Send these to the partner (shown once):</p>
          <p className="mt-2">
            Sign in at <b>{SITE_URL}/partner</b>
          </p>
          <CopyLine label="Email" value={issued.email} />
          <CopyLine label="Password" value={issued.password} />
          <p className="mt-2 text-xs text-emerald-800/80">Lovioo doesn&apos;t keep this password. Ask them to change it under Account after signing in.</p>
          <button onClick={() => setIssued(null)} className="mt-3 text-xs font-semibold text-emerald-800 underline">
            Done, hide it
          </button>
        </div>
      )}

      {brands.data && (
        <div className="space-y-6">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
            <Panel title="Create a partner login">
              {noKey && (
                <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  To create logins here, add <b>SUPABASE_SERVICE_ROLE_KEY</b> (your Supabase secret key) in Vercel → Settings → Environment Variables →
                  Production, then redeploy. Until then: create the user in Supabase → Authentication → Add user (with a password, auto-confirm), then
                  use “Link an existing account”.
                </p>
              )}
              <div className="grid gap-3">
                <Field label="Brand">
                  <select className={adminInput} value={brand} onChange={(e) => setBrand(e.target.value)}>
                    <option value="">Choose a brand…</option>
                    {brands.data.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Contact name (optional)">
                  <input className={adminInput} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
                </Field>
                <Field label="Email">
                  <input type="email" className={adminInput} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="partner@brand.com" />
                </Field>
                <Field label="Password" hint="At least 10 characters. Generate one, then send it to the partner.">
                  <div className="flex gap-2">
                    <input className={cn(adminInput, "font-mono")} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
                    <button type="button" onClick={() => setPassword(generatePassword())} className="btn-ghost shrink-0 !px-3 !py-2 text-xs">
                      <Wand2 className="h-3.5 w-3.5" /> Generate
                    </button>
                  </div>
                </Field>
                <button onClick={create} disabled={busy} className="btn-primary !py-2.5">
                  <UserPlus className="h-4 w-4" /> {busy ? "Creating…" : "Create login"}
                </button>
              </div>
            </Panel>

            <Panel title="Link an existing account">
              <p className="-mt-1 mb-3 text-xs text-ink/55">For someone who already has a Lovioo account (or one you added in the Supabase dashboard).</p>
              <div className="grid gap-3">
                <Field label="Brand">
                  <select className={adminInput} value={linkBrand} onChange={(e) => setLinkBrand(e.target.value)}>
                    <option value="">Choose a brand…</option>
                    {brands.data.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Their account email">
                  <input type="email" className={adminInput} value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} />
                </Field>
                <button onClick={link} className="btn-ghost !py-2.5">
                  <Link2 className="h-4 w-4" /> Link to brand
                </button>
              </div>
            </Panel>
          </div>

          <Panel title="Partner brands and logins">
            {partnerBrands.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink/50">No Brand Partners yet. Create a login above to add the first one.</p>
            ) : (
              <ul className="divide-y divide-ink/5">
                {partnerBrands.map((b) => {
                  const logins = members.data?.filter((m) => m.brand_id === b.id) ?? [];
                  return (
                    <li key={b.id} className="py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="min-w-0 flex-1 font-bold">{b.name}</span>
                        <span className="flex items-center gap-2 text-xs text-ink/60">
                          Brand Partner <Toggle on={b.is_partner} onChange={() => togglePartner(b.id, !b.is_partner)} label={`Brand Partner: ${b.name}`} />
                        </span>
                        <button onClick={() => setStatsBrand(b.id)} className="btn-ghost !px-3 !py-1.5 text-xs">
                          See stats
                        </button>
                      </div>
                      <ul className="mt-2 space-y-1.5">
                        {logins.map((m) => (
                          <li key={m.user_id} className="flex flex-wrap items-center gap-2 rounded-xl bg-ink/[0.03] px-3 py-2 text-sm">
                            <span className="min-w-0 flex-1 truncate">
                              {m.full_name ? `${m.full_name} · ` : ""}
                              <span className="text-ink/70">{m.email}</span>
                            </span>
                            <span className="text-[11px] text-ink/45">
                              {m.last_sign_in_at ? `Last sign-in ${new Date(m.last_sign_in_at).toLocaleDateString("en-PH")}` : "Never signed in"}
                            </span>
                            <button onClick={() => reset(m.user_id, m.email)} className="btn-ghost !px-2.5 !py-1 text-[11px]">
                              <KeyRound className="h-3.5 w-3.5" /> New password
                            </button>
                            <button onClick={() => remove(m.user_id, b.id, m.email)} className="btn-ghost !px-2.5 !py-1 text-[11px] text-coral">
                              <UserMinus className="h-3.5 w-3.5" /> Remove access
                            </button>
                          </li>
                        ))}
                        {logins.length === 0 && <li className="text-xs text-ink/45">No logins yet.</li>}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {statsBrand && (
            <Panel
              title={`${brandName(statsBrand)}: what the partner sees`}
              action={
                <div className="flex items-center gap-2">
                  {[7, 30, 90].map((r) => (
                    <button key={r} onClick={() => setDays(r)} className={cn("rounded-full px-3 py-1 text-xs font-semibold", days === r ? "bg-pink text-white" : "bg-ink/5 text-ink/60")}>
                      {r}d
                    </button>
                  ))}
                  <button onClick={stats.reload} className="grid h-7 w-7 place-items-center rounded-full bg-ink/5" aria-label="Refresh stats">
                    <RefreshCw className={cn("h-3.5 w-3.5", stats.loading && "animate-spin")} />
                  </button>
                </div>
              }
            >
              {stats.error && <ErrorNote message={stats.error} />}
              {stats.data ? <PartnerStatsView stats={stats.data} /> : <Skeleton className="h-40" />}
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}

function CopyLine({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="w-20 text-xs font-semibold text-emerald-800">{label}</span>
      <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-2 py-1 font-mono text-[13px]">{value}</code>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          } catch {
            /* select manually */
          }
        }}
        className="btn-ghost !px-2.5 !py-1 text-[11px]"
        aria-label={`Copy ${label}`}
      >
        {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
