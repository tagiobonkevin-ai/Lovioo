"use client";

import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/Providers";
import { adminDb, saveWith, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Panel, Skeleton, Toggle, adminInput } from "@/components/admin/ui";
import { brandSlug } from "@/lib/data/brands";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Row = Database["public"]["Tables"]["collections"]["Row"];
type Patch = Database["public"]["Tables"]["collections"]["Update"];
type Flag = "published" | "in_stories" | "in_brand_crush" | "in_todays_finds";

const FLAGS: { key: Flag; label: string; hint: string }[] = [
  { key: "published", label: "Published", hint: "Shoppers can see it" },
  { key: "in_stories", label: "Crush Stories", hint: "A story bubble on the home page and Discover" },
  { key: "in_brand_crush", label: "Brand Crush row", hint: "A card in “Some Finds Just Hit Different.”" },
  { key: "in_todays_finds", label: "Today's Finds", hint: "Leads the “Today's Finds” section (the first one wins)" },
];

/** Admin -> Collections: the curated sets behind Crush Stories, the Brand Crush row and Today's Finds. */
export default function AdminCollections() {
  const router = useRouter();
  const { data, error, loading, setData, reload } = useAdminQuery((sb) => sb.from("collections").select("*").order("sort").order("created_at"));
  const items = useAdminQuery((sb) => sb.from("collection_items").select("collection_id"));
  const [title, setTitle] = useState("");

  const count = (id: string) => items.data?.filter((i) => i.collection_id === id).length ?? 0;

  const toggle = async (c: Row, k: Flag) => {
    setData((rows) => rows?.map((r) => (r.id === c.id ? { ...r, [k]: !c[k] } : r)) ?? null);
    const ok = await saveWith(adminDb().from("collections").update({ [k]: !c[k] } as Patch).eq("id", c.id), `${c.title} updated`);
    if (!ok) reload();
  };

  /** Moves a collection one place up or down by renumbering the whole list, so the order is always clean. */
  const move = async (index: number, dir: -1 | 1) => {
    if (!data) return;
    const next = [...data];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setData(next.map((r, i) => ({ ...r, sort: i })));
    const results = await Promise.all(next.map((r, i) => adminDb().from("collections").update({ sort: i }).eq("id", r.id)));
    const failed = results.find((r) => r.error);
    if (failed) await saveWith(Promise.resolve(failed), "");
    else await saveWith(Promise.resolve({ error: null }), "Order saved");
    reload();
  };

  const add = async () => {
    const name = title.trim();
    const id = brandSlug(name);
    if (!name || !id) return;
    if (data?.some((c) => c.id === id)) {
      toast({ title: "That collection already exists", body: `Open “${data.find((c) => c.id === id)?.title}” below, or pick another title.`, kind: "error" });
      return;
    }
    const sort = (data?.length ?? 0) + 1;
    if (await saveWith(adminDb().from("collections").insert({ id, title: name, sort }), `${name} created — add products next`)) {
      setTitle("");
      router.push(`/admin/collections/${id}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Collections"
        sub="Curated sets of products for the home page: Crush Stories, the Brand Crush row and Today's Finds. Switch a collection on where you want it, and drag the order with the arrows."
      />
      {error && <ErrorNote message={error} />}
      {loading && !data && <Skeleton className="h-64" />}
      {data && (
        <div className="space-y-5">
          <Panel>
            <div className="flex flex-wrap gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="New collection title, e.g. Payday Crush"
                className={cn(adminInput, "min-w-[220px] flex-1")}
                aria-label="New collection title"
              />
              <button onClick={add} disabled={!brandSlug(title)} className="btn-primary !py-2">
                <Plus className="h-4 w-4" /> New collection
              </button>
            </div>
            <p className="mt-2 text-[11px] text-ink/50">
              Sections with nothing switched on keep filling themselves automatically, so the home page never goes blank.
            </p>
          </Panel>

          <ul className="space-y-3">
            {data.map((c, i) => (
              <li key={c.id}>
                <Panel className={cn(!c.published && "opacity-75")}>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col">
                      <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${c.title} up`} className="grid h-7 w-7 place-items-center rounded-lg text-ink/50 hover:bg-ink/5 disabled:opacity-25">
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button onClick={() => move(i, 1)} disabled={i === data.length - 1} aria-label={`Move ${c.title} down`} className="grid h-7 w-7 place-items-center rounded-lg text-ink/50 hover:bg-ink/5 disabled:opacity-25">
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                    <Link href={`/admin/collections/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-pink-soft text-2xl">
                        {c.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.cover_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span aria-hidden>{c.emoji}</span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold">
                          {c.emoji} {c.title}
                        </span>
                        <span className="text-xs text-ink/50">
                          /crush/{c.id} · {count(c.id)} {count(c.id) === 1 ? "product" : "products"}
                        </span>
                      </span>
                    </Link>
                    <Link href={`/admin/collections/${c.id}`} className="btn-ghost !px-3 !py-1.5 text-xs">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <a href={`/crush/${c.id}`} target="_blank" rel="noreferrer" className="btn-ghost !px-3 !py-1.5 text-xs" aria-label={`Preview ${c.title}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <div className="mt-4 grid gap-2 border-t border-ink/10 pt-3 sm:grid-cols-2 lg:grid-cols-4">
                    {FLAGS.map((f) => (
                      <span key={f.key} className="flex items-center justify-between gap-2 rounded-xl bg-ink/[0.03] px-3 py-2" title={f.hint}>
                        <span className="text-xs font-semibold text-ink/70">{f.label}</span>
                        <Toggle on={c[f.key]} onChange={() => toggle(c, f.key)} label={`${f.label}: ${c.title}`} />
                      </span>
                    ))}
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
          {data.length === 0 && <p className="py-8 text-center text-sm text-ink/50">No collections yet. Create your first one above.</p>}
        </div>
      )}
    </div>
  );
}
