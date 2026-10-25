"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { isAdminRole, useAdminRole } from "@/components/admin/AdminShell";
import { adminDb, saveWith, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Panel, Skeleton, Toggle, adminInput } from "@/components/admin/ui";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { CATEGORIES, categoryById } from "@/lib/data/categories";
import { isPlaceholderUrl } from "@/lib/data/retailers";
import { cn, peso } from "@/lib/utils";

export default function AdminProducts() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "hidden" | "review" | "needs-link" | "see-prices">("all");
  const { data, error, loading, setData } = useAdminQuery((sb) =>
    sb.from("products").select("id, slug, name, brand, category_id, emoji, image, published, trending, is_new, price_tracked, updated_at, review_requested_at, offers(retailer_id, price, in_stock, url)").order("sort").order("created_at"),
  );
  // Submitted drafts, plus products with pending change requests (editors see their own, admins everyone's).
  const requests = useAdminQuery((sb) => sb.from("product_change_requests").select("product_id").eq("status", "pending"));
  const inReview = useMemo(() => {
    const ids = new Set(requests.data?.map((r) => r.product_id));
    for (const p of data ?? []) if (!p.published && p.review_requested_at) ids.add(p.id);
    return ids;
  }, [data, requests.data]);

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (p) =>
          (!q || `${p.name} ${p.brand} ${p.slug}`.toLowerCase().includes(q.toLowerCase())) &&
          (!cat || p.category_id === cat) &&
          (status === "all" ||
            (status === "review"
              ? inReview.has(p.id)
              : status === "needs-link"
                ? p.offers.some((o) => isPlaceholderUrl(o.url))
                : status === "see-prices"
                  ? !p.price_tracked
                  : (status === "published") === p.published)),
      ),
    [data, q, cat, status, inReview],
  );

  const canPublish = isAdminRole(useAdminRole());
  const togglePublished = async (id: string, published: boolean) => {
    const ok = await saveWith(adminDb().from("products").update({ published }).eq("id", id), published ? "Published" : "Hidden from shoppers");
    if (ok) setData((d) => d?.map((p) => (p.id === id ? { ...p, published } : p)) ?? null);
  };

  return (
    <div>
      <PageHeader title="Products" sub={data ? `${data.length} products · ${data.filter((p) => p.published).length} published` : undefined}>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </PageHeader>

      <Panel>
        <div className="mb-4 flex flex-wrap gap-2">
          <label className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-midnight/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className={cn(adminInput, "pl-9")} />
          </label>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className={cn(adminInput, "!w-auto")} aria-label="Category">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={cn(adminInput, "!w-auto")} aria-label="Status">
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
            <option value="review">Waiting for review{inReview.size ? ` (${inReview.size})` : ""}</option>
            <option value="needs-link">Needs real store links</option>
            <option value="see-prices">&quot;See prices&quot; picks</option>
          </select>
        </div>

        {error && <ErrorNote message={error} />}
        {loading && !data && <Skeleton className="h-64" />}
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-midnight/50">
                <tr>
                  <th className="pb-3 font-semibold">Product</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Stores</th>
                  <th className="pb-3 text-right font-semibold">Lowest</th>
                  <th className="pb-3 text-center font-semibold">Published</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const lowest = p.offers.length ? Math.min(...p.offers.map((o) => o.price)) : null;
                  return (
                    <tr key={p.id} className="border-t border-line/70 hover:bg-cream/60">
                      <td className="py-2.5">
                        <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl text-xl" style={{ background: categoryById(p.category_id).tint }}>
                            {p.emoji}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold hover:text-pink">{p.name}</span>
                            <span className="text-xs text-midnight/50">
                              {p.brand}
                              {p.trending && " · 🔥 trending"}
                              {p.offers.some((o) => isPlaceholderUrl(o.url)) && <span className="ml-1 rounded-full bg-sunset/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#B86E00]">needs link</span>}
                              {p.is_new && " · new"}
                              {inReview.has(p.id) && <span className="ml-1 rounded-full bg-lavender px-1.5 py-0.5 text-[10px] font-semibold text-grape">in review</span>}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="py-2.5 text-midnight/70">{categoryById(p.category_id).name}</td>
                      <td className="py-2.5">
                        <span className="flex gap-1">
                          {p.offers.map((o) => (
                            <RetailerBadge key={o.retailer_id} id={o.retailer_id} size="xs" className={cn(!o.in_stock && "opacity-30")} />
                          ))}
                          {p.offers.length === 0 && <span className="text-xs text-coral">No offers</span>}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold">
                        {!p.price_tracked ? <span className="text-xs text-grape">See prices</span> : lowest != null ? peso(lowest) : "—"}
                      </td>
                      <td className="py-2.5">
                        <span className="flex justify-center">
                          {canPublish ? (
                            <Toggle on={p.published} onChange={() => togglePublished(p.id, !p.published)} label={`Publish ${p.name}`} />
                          ) : (
                            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", p.published ? "bg-emerald-50 text-emerald-600" : "bg-line text-midnight/60")}>
                              {p.published ? "Live" : "Draft"}
                            </span>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <p className="py-8 text-center text-sm text-midnight/50">No products match.</p>}
          </div>
        )}
      </Panel>
    </div>
  );
}
