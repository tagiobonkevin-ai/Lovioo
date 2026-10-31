"use client";

import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Plus, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { adminDb, saveWith, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, Field, PageHeader, Panel, Skeleton, Toggle, adminInput } from "@/components/admin/ui";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Row = Database["public"]["Tables"]["collections"]["Row"];
type Pick = { id: string; name: string; brand: string; image: string; emoji: string; published: boolean };

const httpsOrEmpty = (s: string) => !s.trim() || /^https:\/\//i.test(s.trim());

/** Edit one collection: its wording, cover, where it shows, and which products it holds in what order. */
export default function CollectionEditor({ params }: { params: { id: string } }) {
  const router = useRouter();
  const col = useAdminQuery((sb) => sb.from("collections").select("*").eq("id", params.id).maybeSingle(), [params.id]);
  const items = useAdminQuery((sb) => sb.from("collection_items").select("product_id, sort").eq("collection_id", params.id).order("sort"), [params.id]);
  const all = useAdminQuery((sb) => sb.from("products").select("id, name, brand, image, emoji, published").order("name"));

  const [draft, setDraft] = useState<Row | null>(null);
  const [list, setList] = useState<string[] | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setDraft(col.data ?? null), [col.data]);
  useEffect(() => setList(items.data ? items.data.map((i) => i.product_id) : null), [items.data]);

  const byId = useMemo(() => new Map((all.data ?? []).map((p) => [p.id, p as Pick])), [all.data]);
  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return (all.data ?? [])
      .filter((p) => !list?.includes(p.id) && words.every((w) => `${p.name} ${p.brand}`.toLowerCase().includes(w)))
      .slice(0, 20) as Pick[];
  }, [q, all.data, list]);

  if (col.error) return <ErrorNote message={col.error} />;
  if (col.loading && !draft) return <Skeleton className="h-96" />;
  if (!draft)
    return (
      <Panel>
        <p className="text-sm text-ink/60">This collection doesn&apos;t exist (it may have been deleted).</p>
        <Link href="/admin/collections" className="btn-ghost mt-4">
          <ArrowLeft className="h-4 w-4" /> Back to collections
        </Link>
      </Panel>
    );

  const set = <K extends keyof Row>(k: K, v: Row[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const move = (i: number, dir: -1 | 1) =>
    setList((l) => {
      if (!l) return l;
      const j = i + dir;
      if (j < 0 || j >= l.length) return l;
      const next = [...l];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = async () => {
    if (!draft.title.trim()) return saveWith(Promise.resolve({ error: { message: "Give the collection a title." } }), "");
    if (!httpsOrEmpty(draft.cover_url)) return saveWith(Promise.resolve({ error: { message: "The cover photo link must start with https://" } }), "");
    setBusy(true);
    const ids = list ?? [];
    const update = await adminDb()
      .from("collections")
      .update({
        title: draft.title.trim(),
        tagline: draft.tagline.trim(),
        eyebrow: draft.eyebrow.trim(),
        description: draft.description.trim(),
        emoji: draft.emoji.trim() || "💘",
        cover_url: draft.cover_url.trim(),
        published: draft.published,
        in_stories: draft.in_stories,
        in_brand_crush: draft.in_brand_crush,
        in_todays_finds: draft.in_todays_finds,
      })
      .eq("id", draft.id);
    // Products: write the new order first, then remove the ones taken out — never an empty collection in between.
    const upsert = update.error || !ids.length
      ? { error: null }
      : await adminDb().from("collection_items").upsert(ids.map((product_id, sort) => ({ collection_id: draft.id, product_id, sort })), { onConflict: "collection_id,product_id" });
    const removed = (items.data ?? []).map((i) => i.product_id).filter((id) => !ids.includes(id));
    const cleanup =
      update.error || upsert.error || !removed.length
        ? { error: null }
        : await adminDb().from("collection_items").delete().eq("collection_id", draft.id).in("product_id", removed);
    setBusy(false);
    if (await saveWith(Promise.resolve({ error: update.error ?? upsert.error ?? cleanup.error }), `${draft.title} saved`)) {
      col.reload();
      items.reload();
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete “${draft.title}”? Its products stay in the catalogue; only this collection goes.`)) return;
    if (await saveWith(adminDb().from("collections").delete().eq("id", draft.id), `${draft.title} deleted`)) router.push("/admin/collections");
  };

  const flags: { key: "published" | "in_stories" | "in_brand_crush" | "in_todays_finds"; label: string; hint: string }[] = [
    { key: "published", label: "Published", hint: "Shoppers can see it" },
    { key: "in_stories", label: "In Crush Stories", hint: "A story bubble on the home page and Discover" },
    { key: "in_brand_crush", label: "In Brand Crush row", hint: "A card under “Some Finds Just Hit Different.”" },
    { key: "in_todays_finds", label: "Today's Finds section", hint: "Its label, title, pink line, description and products lead that section" },
  ];

  return (
    <div>
      <Link href="/admin/collections" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink/55 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All collections
      </Link>
      <PageHeader title={`${draft.emoji} ${draft.title || "Untitled"}`} sub={`/crush/${draft.id}`}>
        <a href={`/crush/${draft.id}`} target="_blank" rel="noreferrer" className="btn-ghost !py-2">
          <ExternalLink className="h-4 w-4" /> Preview
        </a>
        <button onClick={save} disabled={busy} className="btn-primary !py-2">
          {busy ? "Saving…" : "Save"}
        </button>
      </PageHeader>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Panel title="Wording">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Small label" hint="Pink capitals above the title, e.g. PRICES TODAY">
                <input className={adminInput} maxLength={40} value={draft.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
              </Field>
              <Field label="Emoji" hint="Shown on stories and cards">
                <input className={adminInput} maxLength={8} value={draft.emoji} onChange={(e) => set("emoji", e.target.value)} />
              </Field>
              <Field label="Title" hint="e.g. Today's Finds.">
                <input className={adminInput} maxLength={80} value={draft.title} onChange={(e) => set("title", e.target.value)} />
              </Field>
              <Field label="Pink second line" hint="e.g. Loving It Already.">
                <input className={adminInput} maxLength={140} value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} />
              </Field>
              <Field label="Description" className="sm:col-span-2" hint="One or two sentences for the section and the collection page">
                <textarea className={adminInput} rows={3} maxLength={600} value={draft.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
              <Field label="Cover photo link" className="sm:col-span-2" hint="For the Brand Crush card. https:// only; leave empty to use the first product photo">
                <input className={cn(adminInput, !httpsOrEmpty(draft.cover_url) && "!border-coral")} value={draft.cover_url} onChange={(e) => set("cover_url", e.target.value)} placeholder="https://…" />
              </Field>
            </div>
          </Panel>

          <Panel title={`Products (${list?.length ?? 0})`}>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products to add…" className={cn(adminInput, "pl-9")} aria-label="Search products to add" />
            </label>
            {q && (
              <ul className="mt-2 max-h-72 divide-y divide-ink/5 overflow-y-auto rounded-xl border border-ink/10">
                {results.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 p-2">
                    <Thumb p={p} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{p.name}</span>
                      <span className="text-xs text-ink/50">
                        {p.brand}
                        {!p.published && " · draft"}
                      </span>
                    </span>
                    <button onClick={() => setList((l) => [...(l ?? []), p.id])} className="btn-ghost !px-3 !py-1.5 text-xs">
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </li>
                ))}
                {results.length === 0 && <li className="p-3 text-sm text-ink/50">No matching products that aren&apos;t already in this collection.</li>}
              </ul>
            )}

            <ol className="mt-4 space-y-2">
              {(list ?? []).map((id, i) => {
                const p = byId.get(id);
                return (
                  <li key={id} className="flex items-center gap-3 rounded-xl border border-ink/10 p-2">
                    <span className="w-5 text-center text-xs font-bold text-ink/40">{i + 1}</span>
                    {p ? <Thumb p={p} /> : <span className="h-11 w-11 rounded-lg bg-ink/5" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{p?.name ?? id}</span>
                      <span className="text-xs text-ink/50">
                        {p?.brand}
                        {p && !p.published && <span className="ml-1 rounded-full bg-sunset/20 px-1.5 py-0.5 font-semibold text-ink/70">draft — hidden until published</span>}
                      </span>
                    </span>
                    <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-ink/5 disabled:opacity-25">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === (list?.length ?? 0) - 1} aria-label="Move down" className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-ink/5 disabled:opacity-25">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button onClick={() => setList((l) => (l ?? []).filter((x) => x !== id))} aria-label="Remove from collection" className="grid h-8 w-8 place-items-center rounded-lg text-coral hover:bg-coral/10">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ol>
            {list && list.length === 0 && <p className="mt-3 text-sm text-ink/50">No products yet — search above to add some.</p>}
            <p className="mt-3 text-[11px] text-ink/45">Changes to products and order are kept when you press Save.</p>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Where it shows">
            <div className="space-y-3">
              {flags.map((f) => (
                <div key={f.key} className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-sm font-semibold">{f.label}</span>
                    <span className="block text-[11px] text-ink/50">{f.hint}</span>
                  </span>
                  <Toggle on={draft[f.key]} onChange={() => set(f.key, !draft[f.key])} label={f.label} />
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-ink/45">Press Save to apply.</p>
          </Panel>

          <Panel title="Card preview">
            <div className="relative mx-auto aspect-[4/5] max-w-[300px] overflow-hidden rounded-[1.5rem] bg-pink-soft">
              {draft.cover_url && httpsOrEmpty(draft.cover_url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-6xl" aria-hidden>
                  {draft.emoji}
                </span>
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-4 text-white">
                {draft.eyebrow && <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">{draft.eyebrow}</span>}
                <span className="mt-1 block font-display text-[22px] font-medium leading-tight">{draft.title || "Untitled"}</span>
                {draft.tagline && <span className="mt-0.5 block text-[13px] text-white/85">{draft.tagline}</span>}
              </span>
            </div>
          </Panel>

          <button onClick={remove} className="btn w-full border border-coral/30 bg-white !py-2 text-coral">
            <Trash2 className="h-4 w-4" /> Delete collection
          </button>
        </div>
      </div>
    </div>
  );
}

function Thumb({ p }: { p: Pick }) {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-pink-soft text-lg">
      {p.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt="" className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden>{p.emoji}</span>
      )}
    </span>
  );
}
