"use client";

import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Panel, Skeleton, adminInput } from "@/components/admin/ui";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { BUDGETS, categoryById } from "@/lib/data/categories";
import { GENDERS, ageOn } from "@/lib/profile";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Shopper = Profile & { saves: number; alerts: number; swipes: number };
type ConsentEvent = Database["public"]["Tables"]["consent_events"]["Row"];

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
] as const;

/** Shopper accounts with their profile details, preferences, consents and activity (admins only; also enforced by RLS). */
export default function AdminUsers() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, error, loading } = useAdminQuery<Shopper[]>(async (sb) => {
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
            (filter === "marketing" && u.marketing_opt_in)),
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
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-midnight/40" />
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
        <p className="mb-3 text-[11px] text-midnight/45">Personal details are visible to admins only. Don&apos;t copy them outside Lovioo.</p>
        {error && <ErrorNote message={error} />}
        {loading && !data && <Skeleton className="h-64" />}
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-midnight/50">
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
                    <ShopperRow key={u.id} u={u} open={open} onToggle={() => setOpenId(open ? null : u.id)} />
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <p className="py-8 text-center text-sm text-midnight/50">No shoppers match.</p>}
          </div>
        )}
      </Panel>
    </div>
  );
}

function ShopperRow({ u, open, onToggle }: { u: Shopper; open: boolean; onToggle: () => void }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  return (
    <>
      <tr className={cn("cursor-pointer border-t border-line/70 hover:bg-cream/60", open && "bg-cream/60")} onClick={onToggle}>
        <td className="py-2.5">
          <span className="flex items-center gap-3">
            {u.avatar_url && !photoFailed ? (
              <img src={u.avatar_url} alt="" referrerPolicy="no-referrer" onError={() => setPhotoFailed(true)} className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">{(u.full_name || u.email || "?")[0]?.toUpperCase()}</span>
            )}
            <span className="min-w-0">
              <span className="block truncate font-semibold">{u.full_name || "—"}</span>
              <span className="block truncate text-xs text-midnight/50">{u.email}</span>
            </span>
          </span>
        </td>
        <td className="py-2.5 text-midnight/80">
          {u.birthdate ? ageOn(u.birthdate) : "—"} · {genderLabel(u.gender)}
        </td>
        <td className="max-w-[180px] truncate py-2.5 text-midnight/80">{place(u)}</td>
        <td className="py-2.5">
          {u.profile_completed_at ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Complete</span>
          ) : (
            <span className="rounded-full bg-sunset/20 px-2 py-0.5 text-[11px] font-semibold text-[#9A5B00]">Missing birthday</span>
          )}
        </td>
        <td className="py-2.5 text-right tabular-nums text-midnight/70">
          {u.saves} · {u.alerts} · {u.swipes}
        </td>
        <td className="py-2.5 text-right text-midnight/60">{date(u.created_at)}</td>
        <td className="py-2.5 text-right">
          <button aria-label={open ? `Hide ${u.full_name}` : `Show ${u.full_name}`} aria-expanded={open} className="text-midnight/40">
            <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
          </button>
        </td>
      </tr>
      {open && (
        <tr className="bg-cream/60">
          <td colSpan={7} className="px-3 pb-4">
            <ShopperDetails u={u} />
          </td>
        </tr>
      )}
    </>
  );
}

function ShopperDetails({ u }: { u: Shopper }) {
  const consents = useAdminQuery<ConsentEvent[]>((sb) => sb.from("consent_events").select("*").eq("user_id", u.id).order("created_at", { ascending: false }), [u.id]);
  const budget = BUDGETS.find((b) => b.id === u.budget)?.label ?? "—";
  const item = (label: string, value: React.ReactNode) => (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-midnight/45">{label}</dt>
      <dd className="mt-0.5 text-sm text-midnight/85">{value}</dd>
    </div>
  );
  return (
    <div className="grid gap-4 rounded-2xl bg-white p-4 shadow-soft lg:grid-cols-3">
      <section>
        <h3 className="mb-2 text-xs font-bold text-midnight">Profile</h3>
        <dl className="grid grid-cols-2 gap-3">
          {item("Full name", u.full_name || "—")}
          {item("Email", <span className="break-all">{u.email ?? "—"}</span>)}
          {item("Birthday", u.birthdate ? `${date(u.birthdate)} (${ageOn(u.birthdate)})` : "—")}
          {item("Gender", genderLabel(u.gender))}
          {item("City", u.city ?? "—")}
          {item("Province", u.province ?? "—")}
          {item("Profile completed", date(u.profile_completed_at))}
          {item("Account role", (u.role ?? "customer").replace("_", " "))}
        </dl>
      </section>
      <section>
        <h3 className="mb-2 text-xs font-bold text-midnight">Shopping preferences</h3>
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
        <h3 className="mb-2 text-xs font-bold text-midnight">Consents</h3>
        <dl className="grid grid-cols-2 gap-3">
          {item("Terms accepted", u.terms_accepted_at ? `${date(u.terms_accepted_at)} · v${u.terms_version}` : "Not yet")}
          {item("Privacy read", date(u.privacy_ack_at))}
          {item("Marketing emails", u.marketing_opt_in ? "✅ Opted in" : "No")}
          {item("Analytics", u.analytics_opt_in ? "✅ Allowed" : "No")}
        </dl>
        <h4 className="mb-1 mt-4 text-[10px] font-semibold uppercase tracking-wider text-midnight/45">History</h4>
        {consents.error && <p className="text-xs text-coral">{consents.error}</p>}
        <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-midnight/70">
          {consents.data?.map((e) => (
            <li key={e.id}>
              {date(e.created_at, true)} · {e.kind} {e.granted ? "✓" : "✗"} <span className="text-midnight/40">({e.source.replace("_", " ")})</span>
            </li>
          ))}
          {consents.data?.length === 0 && <li className="text-midnight/40">No consent records yet.</li>}
        </ul>
      </section>
    </div>
  );
}
