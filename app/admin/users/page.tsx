"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Panel, Skeleton, adminInput } from "@/components/admin/ui";
import { categoryById } from "@/lib/data/categories";
import { cn } from "@/lib/utils";

export default function AdminUsers() {
  const [q, setQ] = useState("");
  const { data, error, loading } = useAdminQuery(async (sb) => {
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

  const rows = useMemo(() => (data ?? []).filter((u) => !q || `${u.full_name} ${u.email}`.toLowerCase().includes(q.toLowerCase())), [data, q]);

  return (
    <div>
      <PageHeader title="Shoppers" sub={data ? `${data.length} accounts` : undefined} />
      <Panel>
        <label className="relative mb-4 block max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-midnight/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className={cn(adminInput, "pl-9")} />
        </label>
        {error && <ErrorNote message={error} />}
        {loading && !data && <Skeleton className="h-64" />}
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-midnight/50">
                <tr>
                  <th className="pb-3 font-semibold">Shopper</th>
                  <th className="pb-3 font-semibold">Interests</th>
                  <th className="pb-3 text-right font-semibold">Saves</th>
                  <th className="pb-3 text-right font-semibold">Alerts</th>
                  <th className="pb-3 text-right font-semibold">Swipes</th>
                  <th className="pb-3 text-right font-semibold">Streak</th>
                  <th className="pb-3 text-right font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-t border-line/70">
                    <td className="py-2.5">
                      <span className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">{(u.full_name || u.email || "?")[0]?.toUpperCase()}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{u.full_name || "—"}</span>
                          <span className="block truncate text-xs text-midnight/50">{u.email}</span>
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5">{u.interests.map((i) => categoryById(i).emoji).join(" ") || <span className="text-midnight/40">—</span>}</td>
                    <td className="py-2.5 text-right">{u.saves}</td>
                    <td className="py-2.5 text-right">{u.alerts}</td>
                    <td className="py-2.5 text-right">{u.swipes}</td>
                    <td className="py-2.5 text-right">{u.streak ? `🔥 ${u.streak}` : "—"}</td>
                    <td className="py-2.5 text-right text-midnight/60">{new Date(u.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="py-8 text-center text-sm text-midnight/50">No shoppers yet.</p>}
          </div>
        )}
      </Panel>
    </div>
  );
}
