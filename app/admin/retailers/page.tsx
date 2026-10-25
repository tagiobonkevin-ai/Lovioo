"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { adminDb, saveWith, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, Field, PageHeader, Panel, Skeleton, Toggle, adminInput } from "@/components/admin/ui";
import { linkError } from "@/lib/links";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Row = Database["public"]["Tables"]["retailers"]["Row"];

export default function AdminRetailers() {
  const { data, error, loading, setData, reload } = useAdminQuery((sb) => sb.from("retailers").select("*").order("sort"));
  const counts = useAdminQuery((sb) => sb.from("offers").select("retailer_id"));
  const [draft, setDraft] = useState({ id: "", name: "", color: "#FF2D9A", homepage: "" });

  const offerCount = (id: string) => counts.data?.filter((o) => o.retailer_id === id).length ?? 0;
  const patch = (id: string, p: Partial<Row>) => setData((rows) => rows?.map((r) => (r.id === id ? { ...r, ...p } : r)) ?? null);

  const linkProblem = (r: Pick<Row, "homepage" | "affiliate_url">) => linkError("Homepage", r.homepage) ?? linkError("Affiliate link", r.affiliate_url);
  const refuse = (message: string) => saveWith(Promise.resolve({ error: { message } }), "");

  const save = (r: Row) => {
    const bad = linkProblem(r);
    if (bad) return refuse(bad);
    return saveWith(
      adminDb()
        .from("retailers")
        .update({ name: r.name, short: r.short, color: r.color, text_color: r.text_color, homepage: r.homepage?.trim() || null, active: r.active, affiliate_url: r.affiliate_url?.trim() || null })
        .eq("id", r.id),
      `${r.name} saved`,
    );
  };

  const add = async () => {
    const id = draft.id.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(id) || !draft.name.trim()) return;
    const bad = linkError("Homepage", draft.homepage);
    if (bad) return refuse(bad);
    const ok = await saveWith(
      adminDb()
        .from("retailers")
        .insert({ id, name: draft.name.trim(), short: draft.name.trim().slice(0, 2), color: draft.color, homepage: draft.homepage.trim() || null, sort: (data?.length ?? 0) + 1 }),
      `${draft.name} added`,
    );
    if (ok) {
      setDraft({ id: "", name: "", color: "#FF2D9A", homepage: "" });
      reload();
    }
  };

  return (
    <div>
      <PageHeader title="Retailer sources" sub="Stores Lovioo compares. Turning a store off hides its offers from shoppers right away (within a minute)." />
      {error && <ErrorNote message={error} />}
      {loading && !data && <Skeleton className="h-64" />}
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {data.map((r) => (
              <Panel key={r.id} className={cn(!r.active && "opacity-70")}>
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl text-sm font-bold" style={{ background: r.color, color: r.text_color }}>
                    {r.short}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{r.name}</p>
                    <p className="text-xs text-midnight/50">
                      {r.id} · {offerCount(r.id)} offers
                    </p>
                  </div>
                  <span className="flex items-center gap-2 text-xs text-midnight/60">
                    {r.active ? "Online" : "Off"}
                    <Toggle
                      on={r.active}
                      label={`${r.name} active`}
                      onChange={async () => {
                        patch(r.id, { active: !r.active });
                        if (!(await save({ ...r, active: !r.active }))) patch(r.id, { active: r.active });
                      }}
                    />
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Field label="Name">
                    <input className={adminInput} value={r.name} onChange={(e) => patch(r.id, { name: e.target.value })} />
                  </Field>
                  <Field label="Badge text">
                    <input className={adminInput} maxLength={3} value={r.short} onChange={(e) => patch(r.id, { short: e.target.value })} />
                  </Field>
                  <Field label="Badge colour">
                    <input type="color" className="h-10 w-full cursor-pointer rounded-xl border border-line bg-white" value={r.color} onChange={(e) => patch(r.id, { color: e.target.value })} />
                  </Field>
                  <Field label="Text colour">
                    <input type="color" className="h-10 w-full cursor-pointer rounded-xl border border-line bg-white" value={toHex(r.text_color)} onChange={(e) => patch(r.id, { text_color: e.target.value })} />
                  </Field>
                  <Field label="Homepage" className="col-span-2">
                    <input className={cn(adminInput, linkError("", r.homepage) && "!border-coral")} value={r.homepage ?? ""} onChange={(e) => patch(r.id, { homepage: e.target.value })} placeholder="https://…" />
                  </Field>
                  <Field label="Affiliate link" hint="Used for this store's offers that don't have their own product link yet." className="col-span-2">
                    <input className={cn(adminInput, linkError("", r.affiliate_url) && "!border-coral")} value={r.affiliate_url ?? ""} onChange={(e) => patch(r.id, { affiliate_url: e.target.value })} placeholder="https://…" />
                  </Field>
                </div>
                {linkProblem(r) && <p className="mt-2 text-[11px] font-medium text-coral">{linkProblem(r)}</p>}
                <button onClick={() => save(r)} className="btn-dark mt-4 w-full !py-2">
                  Save
                </button>
              </Panel>
            ))}
          </div>

          <Panel title="Add a store">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_100px_1.5fr_auto] sm:items-end">
              <Field label="ID" hint="Lowercase, e.g. zalora">
                <input className={adminInput} value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
              </Field>
              <Field label="Name">
                <input className={adminInput} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </Field>
              <Field label="Colour">
                <input type="color" className="h-10 w-full rounded-xl border border-line" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
              </Field>
              <Field label="Homepage">
                <input className={adminInput} value={draft.homepage} onChange={(e) => setDraft({ ...draft, homepage: e.target.value })} placeholder="https://" />
              </Field>
              <button onClick={add} disabled={!/^[a-z0-9-]+$/.test(draft.id.trim().toLowerCase()) || !draft.name.trim()} className="btn-primary mb-0.5">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

/** The colour input needs #rrggbb; seed data uses short #fff. */
function toHex(c: string) {
  return /^#[0-9a-f]{3}$/i.test(c) ? "#" + [...c.slice(1)].map((x) => x + x).join("") : c;
}
