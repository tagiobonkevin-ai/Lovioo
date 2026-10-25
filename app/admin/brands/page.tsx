"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { BrandCard } from "@/components/brand/BrandCrush";
import { adminDb, saveWith, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, Field, PageHeader, Panel, Skeleton, Toggle, adminInput } from "@/components/admin/ui";
import { brandSlug } from "@/lib/data/brands";
import { mapBrand } from "@/lib/data/catalog";
import { RETAILERS } from "@/lib/data/retailers";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Row = Database["public"]["Tables"]["brands"]["Row"];

const httpsOrEmpty = (s: string | null | undefined) => !s || /^https:\/\//i.test(s.trim());

/** Brand and store partners. Featured ones appear in the Brand Crush carousel on the shopper site. */
export default function AdminBrands() {
  const { data, error, loading, setData, reload } = useAdminQuery((sb) => sb.from("brands").select("*").order("featured", { ascending: false }).order("sort").order("name"));
  const counts = useAdminQuery((sb) => sb.from("products").select("brand_id"));
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const productCount = (id: string) => counts.data?.filter((p) => p.brand_id === id).length ?? 0;
  const patch = (id: string, p: Partial<Row>) => setData((rows) => rows?.map((r) => (r.id === id ? { ...r, ...p } : r)) ?? null);
  const rows = useMemo(() => (data ?? []).filter((b) => !q || b.name.toLowerCase().includes(q.toLowerCase())), [data, q]);

  const save = (b: Row) => {
    if (!httpsOrEmpty(b.logo_url) || !httpsOrEmpty(b.cover_url) || !httpsOrEmpty(b.store_url)) {
      return saveWith(Promise.resolve({ error: { message: "Logo, cover and store links must start with https://" } }), "");
    }
    return saveWith(
      adminDb()
        .from("brands")
        .update({
          name: b.name.trim(),
          tagline: b.tagline.trim(),
          description: b.description.trim(),
          logo_url: b.logo_url.trim(),
          cover_url: b.cover_url.trim(),
          color: b.color,
          store_url: b.store_url?.trim() || null,
          retailer_id: b.retailer_id || null,
          featured: b.featured,
          published: b.published,
          sort: b.sort,
        })
        .eq("id", b.id),
      `${b.name} saved`,
    );
  };

  const toggle = async (b: Row, k: "featured" | "published") => {
    patch(b.id, { [k]: !b[k] });
    if (!(await save({ ...b, [k]: !b[k] }))) patch(b.id, { [k]: b[k] });
  };

  const add = async () => {
    const name = newName.trim();
    const id = brandSlug(name);
    if (!name || !id) return;
    if (await saveWith(adminDb().from("brands").insert({ id, name }), `${name} added`)) {
      setNewName("");
      setOpenId(id);
      reload();
    }
  };

  const remove = async (b: Row) => {
    if (!window.confirm(`Delete ${b.name}? Its products stay, they just won't link to a brand page.`)) return;
    if (await saveWith(adminDb().from("brands").delete().eq("id", b.id), `${b.name} deleted`)) reload();
  };

  return (
    <div>
      <PageHeader title="Brands & partners" sub="Brand pages shoppers reach by tapping a brand name. Featured partners appear in Brand Crush 💘 on the home screen." />
      {error && <ErrorNote message={error} />}
      {loading && !data && <Skeleton className="h-64" />}
      {data && (
        <div className="space-y-6">
          <Panel>
            <div className="flex flex-wrap gap-2">
              <label className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-midnight/40" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brands…" className={cn(adminInput, "pl-9")} aria-label="Search brands" />
              </label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New brand or store name" className={cn(adminInput, "!w-60")} aria-label="New brand name" />
              <button onClick={add} disabled={!brandSlug(newName)} className="btn-primary !py-2">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
            <p className="mt-2 text-[11px] text-midnight/50">
              {data.filter((b) => b.featured).length} featured · {data.length} brands. Link products to a brand from the product editor.
            </p>
          </Panel>

          <ul className="space-y-3">
            {rows.map((b) => (
              <li key={b.id}>
                <Panel className={cn(!b.published && "opacity-70")}>
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => setOpenId(openId === b.id ? null : b.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white" style={{ background: b.color }}>
                        {b.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold">{b.name}</span>
                        <span className="text-xs text-midnight/50">
                          /brand/{b.id} · {productCount(b.id)} products{b.store_url ? " · store link" : ""}
                        </span>
                      </span>
                    </button>
                    <span className="flex items-center gap-2 text-xs text-midnight/60">
                      Featured <Toggle on={b.featured} onChange={() => toggle(b, "featured")} label={`Feature ${b.name}`} />
                    </span>
                    <span className="flex items-center gap-2 text-xs text-midnight/60">
                      Visible <Toggle on={b.published} onChange={() => toggle(b, "published")} label={`Show ${b.name}`} />
                    </span>
                  </div>

                  {openId === b.id && (
                    <div className="mt-4 grid gap-5 border-t border-line/70 pt-4 lg:grid-cols-[minmax(0,1fr)_180px]">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Name">
                          <input className={adminInput} value={b.name} onChange={(e) => patch(b.id, { name: e.target.value })} />
                        </Field>
                        <Field label="Tagline" hint="One line under the name, e.g. “Official store · free shipping”">
                          <input className={adminInput} maxLength={140} value={b.tagline} onChange={(e) => patch(b.id, { tagline: e.target.value })} />
                        </Field>
                        <Field label="Logo image URL" hint="Square works best. https:// only">
                          <input className={adminInput} value={b.logo_url} onChange={(e) => patch(b.id, { logo_url: e.target.value })} placeholder="https://…" />
                        </Field>
                        <Field label="Cover image URL" hint="Wide photo for the card and brand page">
                          <input className={adminInput} value={b.cover_url} onChange={(e) => patch(b.id, { cover_url: e.target.value })} placeholder="https://…" />
                        </Field>
                        <Field label="Store link" hint="Official, Mall or affiliate store URL">
                          <input className={adminInput} value={b.store_url ?? ""} onChange={(e) => patch(b.id, { store_url: e.target.value })} placeholder="https://…" />
                        </Field>
                        <Field label="Marketplace">
                          <select className={adminInput} value={b.retailer_id ?? ""} onChange={(e) => patch(b.id, { retailer_id: e.target.value || null })}>
                            <option value="">Own website / not set</option>
                            {Object.values(RETAILERS).map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Brand colour">
                          <input type="color" className="h-10 w-full cursor-pointer rounded-xl border border-line bg-white" value={b.color} onChange={(e) => patch(b.id, { color: e.target.value })} />
                        </Field>
                        <Field label="Order" hint="Lower shows first">
                          <input type="number" className={adminInput} value={b.sort} onChange={(e) => patch(b.id, { sort: Number(e.target.value) })} />
                        </Field>
                        <Field label="About" className="sm:col-span-2">
                          <textarea className={adminInput} rows={3} maxLength={2000} value={b.description} onChange={(e) => patch(b.id, { description: e.target.value })} />
                        </Field>
                        <div className="flex gap-2 sm:col-span-2">
                          <button onClick={() => save(b)} className="btn-dark flex-1 !py-2">
                            Save
                          </button>
                          <button onClick={() => remove(b)} className="btn border border-coral/30 bg-white !py-2 text-coral" aria-label={`Delete ${b.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-midnight/50">Preview</p>
                        <BrandCard brand={mapBrand(b)} className="pointer-events-none w-full" />
                      </div>
                    </div>
                  )}
                </Panel>
              </li>
            ))}
          </ul>
          {rows.length === 0 && <p className="py-8 text-center text-sm text-midnight/50">No brands match.</p>}
        </div>
      )}
    </div>
  );
}
