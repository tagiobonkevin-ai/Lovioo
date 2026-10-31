"use client";

import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Panel, Skeleton } from "@/components/admin/ui";
import { usePartner } from "@/components/partner/PartnerShell";
import { cn } from "@/lib/utils";

/** The partner's products with their status: live, in review, draft, or changes waiting for Lovioo. */
export default function PartnerProducts() {
  const { brand } = usePartner();
  const products = useAdminQuery(
    (sb) =>
      sb
        .from("products")
        .select("id, slug, name, image, emoji, published, review_requested_at, updated_at, offers(retailer_id)")
        .eq("brand_id", brand.id)
        .order("updated_at", { ascending: false }),
    [brand.id],
  );
  const pending = useAdminQuery((sb) => sb.from("product_change_requests").select("product_id").eq("status", "pending"), [brand.id]);
  const waiting = new Set(pending.data?.map((r) => r.product_id));

  const status = (p: { published: boolean; review_requested_at: string | null; id: string }) =>
    p.published
      ? waiting.has(p.id)
        ? { label: "Live · changes in review", tone: "bg-amber-50 text-amber-700" }
        : { label: "Live", tone: "bg-emerald-50 text-emerald-700" }
      : p.review_requested_at
        ? { label: "In review", tone: "bg-amber-50 text-amber-700" }
        : { label: "Draft", tone: "bg-ink/5 text-ink/60" };

  return (
    <div>
      <PageHeader title="Products" sub="Add your products and send them to Lovioo for review. Approved products go live for shoppers.">
        <Link href="/partner/products/new" className="btn-primary !py-2">
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </PageHeader>
      {products.error && <ErrorNote message={products.error} />}
      {products.loading && !products.data && <Skeleton className="h-64" />}
      {products.data && (
        <Panel>
          {products.data.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink/50">No products yet. Add your first one: Lovioo checks it and puts it live.</p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {products.data.map((p) => {
                const s = status(p);
                return (
                  <li key={p.id}>
                    <Link href={`/partner/products/${p.id}`} className="flex items-center gap-3 py-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-pink-soft text-xl">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span aria-hidden>{p.emoji}</span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{p.name}</span>
                        <span className="text-[11px] text-ink/50">
                          {p.offers.length} {p.offers.length === 1 ? "store" : "stores"}
                        </span>
                      </span>
                      <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold", s.tone)}>{s.label}</span>
                      <Pencil className="h-4 w-4 shrink-0 text-ink/35" aria-hidden />
                    </Link>
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
