"use client";

import { Eye, EyeOff, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { adminDb, saveWith, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Panel, Skeleton } from "@/components/admin/ui";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Review = Database["public"]["Tables"]["product_reviews"]["Row"];

/** Admin -> Reviews: what members wrote on product pages. Hide anything off-topic or abusive, or delete it. */
export default function AdminReviews() {
  const [filter, setFilter] = useState<"all" | "low" | "hidden">("all");
  const { data, error, loading, reload, setData } = useAdminQuery(async (sb) => {
    const res = await sb.from("product_reviews").select("*").order("created_at", { ascending: false }).limit(300);
    if (res.error || !res.data?.length) return { data: { reviews: (res.data ?? []) as Review[], names: {} as Record<string, { name: string; slug: string }> }, error: res.error };
    const ids = [...new Set(res.data.map((r) => r.product_id))];
    const prods = await sb.from("products").select("id, name, slug").in("id", ids);
    const names = Object.fromEntries((prods.data ?? []).map((p) => [p.id, { name: p.name, slug: p.slug }]));
    return { data: { reviews: res.data as Review[], names }, error: prods.error };
  });

  const reviews = (data?.reviews ?? []).filter((r) => (filter === "low" ? r.rating <= 2 : filter === "hidden" ? r.hidden : true));

  const toggle = async (r: Review) => {
    if (await saveWith(adminDb().from("product_reviews").update({ hidden: !r.hidden }).eq("id", r.id), r.hidden ? "Review shown again" : "Review hidden")) {
      setData((d) => (d ? { ...d, reviews: d.reviews.map((x) => (x.id === r.id ? { ...x, hidden: !r.hidden } : x)) } : d));
    }
  };
  const remove = async (r: Review) => {
    if (!window.confirm(`Delete ${r.reviewer_name}'s review? This can't be undone.`)) return;
    if (await saveWith(adminDb().from("product_reviews").delete().eq("id", r.id), "Review deleted")) reload();
  };

  return (
    <div>
      <PageHeader title="Reviews" sub="Reviews members write on product pages. Hide anything off-topic, abusive or with personal details; the writer still sees it, marked as hidden.">
        <div className="flex rounded-full bg-white p-1 shadow-sm">
          {(
            [
              ["all", "All"],
              ["low", "1–2 stars"],
              ["hidden", "Hidden"],
            ] as const
          ).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} className={cn("rounded-full px-3.5 py-1.5 text-xs font-semibold", filter === k ? "bg-pink text-white" : "text-ink/60")}>
              {label}
            </button>
          ))}
        </div>
      </PageHeader>
      {error && <ErrorNote message={error} />}
      {loading && !data && <Skeleton className="h-64" />}
      {data && (
        <Panel>
          {reviews.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink/50">No reviews here yet.</p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {reviews.map((r) => {
                const prod = data.names[r.product_id];
                return (
                  <li key={r.id} className={cn("flex flex-wrap items-start gap-3 py-3", r.hidden && "opacity-60")}>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 text-sm">
                        <span className="flex" aria-label={`${r.rating} stars`}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-sunset text-sunset" : "text-ink/15")} aria-hidden />
                          ))}
                        </span>
                        <b>{r.reviewer_name}</b>
                        <span className="text-xs text-ink/45">{new Date(r.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                        {r.hidden && <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink/60">Hidden</span>}
                      </p>
                      {prod && (
                        <Link href={`/product/${prod.slug}`} target="_blank" className="block truncate text-xs font-semibold text-pink hover:underline">
                          {prod.name}
                        </Link>
                      )}
                      {r.body && <p className="mt-1 whitespace-pre-line text-sm text-ink/75 [overflow-wrap:anywhere]">{r.body}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggle(r)} className="btn-ghost !px-3 !py-1.5 text-xs">
                        {r.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} {r.hidden ? "Show" : "Hide"}
                      </button>
                      <button onClick={() => remove(r)} className="btn-ghost !px-3 !py-1.5 text-xs text-coral">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}
