"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { adminDb, saveWith, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Panel, Skeleton, adminInput } from "@/components/admin/ui";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Row = Database["public"]["Tables"]["categories"]["Row"];

export default function AdminCategories() {
  const { data, error, loading, setData, reload } = useAdminQuery((sb) => sb.from("categories").select("*").order("sort"));
  const products = useAdminQuery((sb) => sb.from("products").select("category_id"));
  const [draft, setDraft] = useState({ id: "", name: "", emoji: "✨" });

  const count = (id: string) => products.data?.filter((p) => p.category_id === id).length ?? 0;
  const patch = (id: string, p: Partial<Row>) => setData((rows) => rows?.map((r) => (r.id === id ? { ...r, ...p } : r)) ?? null);

  const add = async () => {
    const id = draft.id.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(id) || !draft.name.trim()) return;
    if (await saveWith(adminDb().from("categories").insert({ id, name: draft.name.trim(), emoji: draft.emoji, sort: (data?.length ?? 0) + 1 }), "Category added")) {
      setDraft({ id: "", name: "", emoji: "✨" });
      reload();
    }
  };

  const remove = async (r: Row) => {
    if (!window.confirm(`Delete the “${r.name}” category?`)) return;
    if (await saveWith(adminDb().from("categories").delete().eq("id", r.id), "Category deleted")) reload();
  };

  return (
    <div>
      <PageHeader title="Categories" sub="Shown as bubbles on the home page, in search filters and onboarding." />
      {error && <ErrorNote message={error} />}
      {loading && !data && <Skeleton className="h-64" />}
      {data && (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-midnight/50">
                <tr>
                  <th className="pb-3 font-semibold">Icon</th>
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Tint</th>
                  <th className="pb-3 text-right font-semibold">Products</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id} className="border-t border-line/70">
                    <td className="py-2 pr-3">
                      <input className={cn(adminInput, "w-14 text-center text-lg")} value={r.emoji} onChange={(e) => patch(r.id, { emoji: e.target.value })} aria-label="Emoji" />
                    </td>
                    <td className="py-2 pr-3">
                      <input className={adminInput} value={r.name} onChange={(e) => patch(r.id, { name: e.target.value })} aria-label="Name" />
                    </td>
                    <td className="py-2 pr-3 text-midnight/50">{r.id}</td>
                    <td className="py-2 pr-3">
                      <input type="color" className="h-9 w-14 cursor-pointer rounded-lg border border-line" value={r.tint} onChange={(e) => patch(r.id, { tint: e.target.value })} aria-label="Tint" />
                    </td>
                    <td className="py-2 pr-3 text-right">{count(r.id)}</td>
                    <td className="py-2">
                      <span className="flex justify-end gap-2">
                        <button onClick={() => saveWith(adminDb().from("categories").update({ name: r.name, emoji: r.emoji, tint: r.tint }).eq("id", r.id), `${r.name} saved`)} className="btn-dark !px-4 !py-1.5">
                          Save
                        </button>
                        <button
                          onClick={() => remove(r)}
                          disabled={count(r.id) > 0}
                          title={count(r.id) > 0 ? "Move or delete its products first" : "Delete"}
                          className="grid h-8 w-8 place-items-center rounded-full text-midnight/40 hover:text-coral disabled:opacity-30"
                          aria-label={`Delete ${r.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-wrap items-end gap-2 border-t border-line/70 pt-5">
            <input className={cn(adminInput, "w-14 text-center text-lg")} value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} aria-label="New category emoji" />
            <input className={cn(adminInput, "w-40")} placeholder="id (e.g. pets)" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} aria-label="New category id" />
            <input className={cn(adminInput, "w-56")} placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="New category name" />
            <button onClick={add} className="btn-primary !py-2" disabled={!draft.id.trim() || !draft.name.trim()}>
              <Plus className="h-4 w-4" /> Add category
            </button>
          </div>
        </Panel>
      )}
    </div>
  );
}
