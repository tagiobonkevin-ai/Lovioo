"use client";

import { BadgeCheck, ChevronDown, Lock, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useAdminRole, isAdminRole } from "@/components/admin/AdminShell";
import { adminDb, useAdminQuery } from "@/components/admin/useAdmin";
import { toast } from "@/components/Providers";
import { ErrorNote, PageHeader, Panel, Skeleton, adminInput } from "@/components/admin/ui";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { BUDGETS, categoryById } from "@/lib/data/categories";
import { GENDERS, ageOn } from "@/lib/profile";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Shopper = Profile & { saves: number; alerts: number; swipes: number };
type ConsentEvent = Database["public"]["Tables"]["consent_events"]["Row"];
type AccountAction = Database["public"]["Tables"]["account_actions"]["Row"];

const date = (iso: string | null, withTime = false) =>
  iso ? new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}) }) : "—";
const genderLabel = (g: Profile["gender"]) => GENDERS.find((x) => x.id === g)?.label ?? "—";
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const place = (u: Profile) => [u.city, u.province].filter(Boolean).join(", ") || "—";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "complete", label: "Profile complete" },
  { id: "incomplete", label: "Missing birthday" },
  { id: "marketing", label: "Emails opted in" },
  { id: "unapproved", label: "Name not approved" },
] as const;

/** Shopper accounts with their profile details, preferences, consents and activity (admins only; also enforced by RLS). */
export default function AdminUsers() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, error, loading, reload } = useAdminQuery<Shopper[]>(async (sb) => {
    const [profiles, saved, alerts, swipes] = await Promise.all([
      sb.from("profiles").select("*").order("created_at", { ascending: false }),
      sb.from("saved_items").select("user_id"),
      sb.from("price_alerts").select("user_id"),
      sb.from("swipes").select("user_id"),
    ]);
    const err = profiles.error ?? saved.error ?? alerts.error ?? swipes.error;
    if (err) return { data: null, error: err };
    const tally = (rows: { user_id: string }[]) => rows.reduce((m, r) => m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1), new Map<string, number>());
    const s = tally(saved.data!);
    const a = tally(alerts.data!);
    const w = tally(swipes.data!);
    return { data: profiles.data!.map((p) => ({ ...p, saves: s.get(p.id) ?? 0, alerts: a.get(p.id) ?? 0, swipes: w.get(p.id) ?? 0 })), error: null };
  });

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (u) =>
          (!q || `${u.full_name} ${u.email} ${u.city ?? ""} ${u.province ?? ""}`.toLowerCase().includes(q.toLowerCase())) &&
          (filter === "all" ||
            (filter === "complete" && !!u.profile_completed_at) ||
            (filter === "incomplete" && !u.profile_completed_at) ||
            (filter === "marketing" && u.marketing_opt_in) ||
            (filter === "unapproved" && !u.name_approved_at)),
      ),
    [data, q, filter],
  );
  const count = (f: (u: Shopper) => boolean) => data?.filter(f).length ?? 0;

  return (
    <div>
      <PageHeader
        title="Shoppers"
        sub={
          data
            ? [plural(data.length, "account"), plural(count((u) => !!u.profile_completed_at), "complete profile"), `${count((u) => u.marketing_opt_in)} opted in to emails`].join(" · ")
            : undefined
        }
      />
      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or place…" className={cn(adminInput, "pl-9")} />
          </label>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Filter shoppers">
            {FILTERS.map((f) => (
              <button key={f.id} role="radio" aria-checked={filter === f.id} onClick={() => setFilter(f.id)} className={cn("chip !py-1.5 text-xs", filter === f.id && "chip-active")}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-3 text-[11px] text-ink/45">Personal details are visible to admins only. Don&apos;t copy them outside Lovioo.</p>
        {error && <ErrorNote message={error} />}
        {loading && !data && <Skeleton className="h-64" />}
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-ink/50">
                <tr>
                  <th className="pb-3 font-semibold">Shopper</th>
                  <th className="pb-3 font-semibold">Age · Gender</th>
                  <th className="pb-3 font-semibold">Location</th>
                  <th className="pb-3 font-semibold">Profile</th>
                  <th className="pb-3 text-right font-semibold">Saves · Alerts · Swipes</th>
                  <th className="pb-3 text-right font-semibold">Joined</th>
                  <th className="w-8 pb-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const open = openId === u.id;
                  return (
                    <ShopperRow key={u.id} u={u} open={open} onToggle={() => setOpenId(open ? null : u.id)} onChanged={reload} />
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <p className="py-8 text-center text-sm text-ink/50">No shoppers match.</p>}
          </div>
        )}
      </Panel>
    </div>
  );
}

function ShopperRow({ u, open, onToggle, onChanged }: { u: Shopper; open: boolean; onToggle: () => void; onChanged: () => void }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  return (
    <>
      <tr className={cn("cursor-pointer border-t border-ink/10 hover:bg-ink/[0.03]/60", open && "bg-ink/[0.03]/60")} onClick={onToggle}>
        <td className="py-2.5">
          <span className="flex items-center gap-3">
            {u.avatar_url && !photoFailed ? (
              <img src={u.avatar_url} alt="" referrerPolicy="no-referrer" onError={() => setPhotoFailed(true)} className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">{(u.full_name || u.email || "?")[0]?.toUpperCase()}</span>
            )}
            <span className="min-w-0">
              <span className="flex items-center gap-1 truncate font-semibold">
                <span className="truncate">{u.full_name || "—"}</span>
                {u.name_approved_at && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Name approved" />}
              </span>
              <span className="block truncate text-xs text-ink/50">{u.email}</span>
            </span>
          </span>
        </td>
        <td className="py-2.5 text-ink/80">
          {u.birthdate ? ageOn(u.birthdate) : "—"} · {genderLabel(u.gender)}
        </td>
        <td className="max-w-[180px] truncate py-2.5 text-ink/80">{place(u)}</td>
        <td className="py-2.5">
          {u.profile_completed_at ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Complete</span>
          ) : (
            <span className="rounded-full bg-sunset/20 px-2 py-0.5 text-[11px] font-semibold text-[#9A5B00]">Missing birthday</span>
          )}
        </td>
        <td className="py-2.5 text-right tabular-nums text-ink/70">
          {u.saves} · {u.alerts} · {u.swipes}
        </td>
        <td className="py-2.5 text-right text-ink/60">{date(u.created_at)}</td>
        <td className="py-2.5 text-right">
          <button aria-label={open ? `Hide ${u.full_name}` : `Show ${u.full_name}`} aria-expanded={open} className="text-ink/40">
            <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
          </button>
        </td>
      </tr>
      {open && (
        <tr className="bg-ink/[0.03]/60">
          <td colSpan={7} className="px-3 pb-4">
            <ShopperDetails u={u} onChanged={onChanged} />
          </td>
        </tr>
      )}
    </>
  );
}

function ShopperDetails({ u, onChanged }: { u: Shopper; onChanged: () => void }) {
  const consents = useAdminQuery<ConsentEvent[]>((sb) => sb.from("consent_events").select("*").eq("user_id", u.id).order("created_at", { ascending: false }), [u.id]);
  const budget = BUDGETS.find((b) => b.id === u.budget)?.label ?? "—";
  const item = (label: string, value: React.ReactNode) => (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink/85">{value}</dd>
    </div>
  );
  return (
    <div className="grid gap-4 rounded-2xl bg-white p-4 shadow-soft lg:grid-cols-3">
      <section>
        <h3 className="mb-2 text-xs font-bold text-ink">Profile</h3>
        <dl className="grid grid-cols-2 gap-3">
          {item("Full name", u.full_name || "—")}
          {item("Email", <span className="break-all">{u.email ?? "—"}</span>)}
          {item("Birthday", u.birthdate ? `${date(u.birthdate)} (${ageOn(u.birthdate)})` : "—")}
          {item("Gender", genderLabel(u.gender))}
          {item("City", u.city ?? "—")}
          {item("Province", u.province ?? "—")}
          {item("Profile completed", date(u.profile_completed_at))}
          {item("Account role", (u.role ?? "customer").replace("_", " "))}
          {item("Name approved", u.name_approved_at ? date(u.name_approved_at, true) : "Not yet")}
        </dl>
      </section>
      <section>
        <h3 className="mb-2 text-xs font-bold text-ink">Shopping preferences</h3>
        <dl className="grid gap-3">
          {item(
            "Interests",
            u.interests.length ? u.interests.map((i) => `${categoryById(i).emoji} ${categoryById(i).name}`).join(", ") : "—",
          )}
          {item("Budget", budget)}
          {item(
            "Stores",
            <span className="flex flex-wrap gap-1">
              {u.platforms.map((r) => (
                <RetailerBadge key={r} id={r} size="xs" />
              ))}
            </span>,
          )}
          {item("Onboarding", u.onboarded ? "Done" : "Not yet")}
          {item("Swipe streak", u.streak ? `🔥 ${u.streak} days` : "—")}
        </dl>
      </section>
      <section>
        <h3 className="mb-2 text-xs font-bold text-ink">Consents</h3>
        <dl className="grid grid-cols-2 gap-3">
          {item("Terms accepted", u.terms_accepted_at ? `${date(u.terms_accepted_at)} · v${u.terms_version}` : "Not yet")}
          {item("Privacy read", date(u.privacy_ack_at))}
          {item("Marketing emails", u.marketing_opt_in ? "✅ Opted in" : "No")}
          {item("Analytics", u.analytics_opt_in ? "✅ Allowed" : "No")}
        </dl>
        <h4 className="mb-1 mt-4 text-[10px] font-semibold uppercase tracking-wider text-ink/45">History</h4>
        {consents.error && <p className="text-xs text-coral">{consents.error}</p>}
        <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-ink/70">
          {consents.data?.map((e) => (
            <li key={e.id}>
              {date(e.created_at, true)} · {e.kind} {e.granted ? "✓" : "✗"} <span className="text-ink/40">({e.source.replace("_", " ")})</span>
            </li>
          ))}
          {consents.data?.length === 0 && <li className="text-ink/40">No consent records yet.</li>}
        </ul>
      </section>
      <section className="lg:col-span-3">
        <AccountActions u={u} onChanged={onChanged} />
      </section>
    </div>
  );
}

/** Approve (and lock) a shopper's name, correct it, or delete the account. Admins and the super admin only. */
function AccountActions({ u, onChanged }: { u: Shopper; onChanged: () => void }) {
  const role = useAdminRole();
  const [name, setName] = useState(u.full_name);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const history = useAdminQuery<AccountAction[]>(
    (sb) => sb.from("account_actions").select("*").eq("target_user", u.id).order("created_at", { ascending: false }).limit(10),
    [u.id],
  );
  if (!role || !isAdminRole(role)) return null;

  const run = async (what: string, p: PromiseLike<{ error: { message: string } | null }>, ok: string) => {
    setBusy(what);
    const { error } = await p;
    setBusy(null);
    if (error) return toast({ title: "Couldn't do that", body: error.message, kind: "error" });
    toast({ title: ok, kind: "ok" });
    setConfirm("");
    history.reload();
    onChanged();
  };

  const approved = !!u.name_approved_at;
  const emailMatches = confirm.trim().toLowerCase() === (u.email ?? "").toLowerCase();

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <h3 className="mb-3 text-xs font-bold text-ink">Account actions</h3>
      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">Name approval</p>
          <p className="mt-1 text-xs text-ink/60">
            {approved ? "Approved — the shopper can no longer change their name." : "Not approved — the shopper can still change their own name."}
          </p>
          <button
            onClick={() => run("approve", adminDb().rpc("approve_shopper_name", { target: u.id, approved: !approved }), approved ? "Approval removed" : "Name approved and locked")}
            disabled={busy === "approve"}
            className={cn("mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition", approved ? "bg-ink/[0.03] text-ink/70 hover:bg-line/60" : "bg-emerald-600 text-white hover:bg-emerald-700")}
          >
            {approved ? <Lock className="h-3.5 w-3.5" /> : <BadgeCheck className="h-3.5 w-3.5" />}
            {busy === "approve" ? "Saving…" : approved ? "Remove approval" : "Approve name"}
          </button>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">Correct the name</p>
          <p className="mt-1 text-xs text-ink/60">Admins can fix a name at any time, approved or not.</p>
          <div className="mt-2 flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-label={`Name for ${u.email}`} className={cn(adminInput, "!py-2 text-sm")} />
            <button
              onClick={() => run("rename", adminDb().rpc("admin_set_shopper_name", { target: u.id, new_name: name }), "Name updated")}
              disabled={busy === "rename" || !name.trim() || name.trim() === u.full_name}
              className="shrink-0 rounded-full bg-midnight px-3 py-2 text-xs font-semibold text-white transition hover:bg-midnight/90 disabled:opacity-40"
            >
              {busy === "rename" ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-coral">Delete account</p>
          <p className="mt-1 text-xs text-ink/60">
            Removes the sign-in, profile, saves, alerts, swipes and consent records for good. Type <b className="break-all">{u.email}</b> to confirm.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type the email"
              aria-label={`Confirm deleting ${u.email}`}
              className={cn(adminInput, "!py-2 text-sm")}
            />
            <button
              onClick={() => run("delete", adminDb().rpc("delete_shopper", { target: u.id, confirm_email: confirm }), "Account deleted")}
              disabled={busy === "delete" || !emailMatches}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-coral px-3 py-2 text-xs font-semibold text-white transition hover:brightness-95 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {busy === "delete" ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {!!history.data?.length && (
        <>
          <h4 className="mb-1 mt-4 text-[10px] font-semibold uppercase tracking-wider text-ink/45">Admin history</h4>
          <ul className="space-y-1 text-xs text-ink/70">
            {history.data.map((a) => (
              <li key={a.id}>
                {date(a.created_at, true)} · {a.action.replace("_", " ")} {a.detail && <span className="text-ink/50">({a.detail})</span>}{" "}
                <span className="text-ink/40">by {a.actor_email || "unknown"}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
