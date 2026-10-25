"use client";

import { BellRing } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Panel, Skeleton } from "@/components/admin/ui";
import { DealScoreRing } from "@/components/product/DealScore";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { buildCatalog } from "@/lib/data/catalog";
import { getInsight } from "@/lib/insights";
import { cn, peso } from "@/lib/utils";

export default function AdminDeals() {
  const [tab, setTab] = useState<"deals" | "alerts">("deals");
  // Reads the live tables (including hidden products) rather than the shopper catalog snapshot.
  const catalog = useAdminQuery(async (sb) => {
    const [c, r, p, s] = await Promise.all([
      sb.from("categories").select("*"),
      sb.from("retailers").select("*"),
      sb.from("products").select("*, offers(*)"),
      sb.from("product_price_stats").select("*"),
    ]);
    const error = c.error ?? r.error ?? p.error ?? s.error;
    return { data: error ? null : buildCatalog(c.data!, r.data!, p.data!, s.data!), error };
  });
  const alerts = useAdminQuery((sb) => sb.from("price_alerts").select("product_id, target_price, enabled"));

  const deals = useMemo(
    () =>
      (catalog.data?.products ?? [])
        .map((p) => ({ p, i: getInsight(p) }))
        .filter(({ i }) => i.priced)
        .sort((a, b) => b.i.dealScore - a.i.dealScore),
    [catalog.data],
  );

  const alertRows = useMemo(() => {
    const byProduct = new Map<string, { total: number; enabled: number; triggered: number }>();
    for (const a of alerts.data ?? []) {
      const p = catalog.data?.products.find((x) => x.id === a.product_id);
      const row = byProduct.get(a.product_id) ?? { total: 0, enabled: 0, triggered: 0 };
      row.total++;
      if (a.enabled) row.enabled++;
      if (a.enabled && p && getInsight(p).bestOffer.price <= a.target_price) row.triggered++;
      byProduct.set(a.product_id, row);
    }
    return [...byProduct.entries()]
      .map(([id, r]) => ({ p: catalog.data?.products.find((x) => x.id === id), ...r }))
      .filter((r) => r.p)
      .sort((a, b) => b.triggered - a.triggered || b.enabled - a.enabled);
  }, [alerts.data, catalog.data]);

  const error = catalog.error ?? alerts.error;
  return (
    <div>
      <PageHeader title="Deals & alerts" sub="Deal scores compare today's best price with the 90-day history. Alerts fire when the best price reaches a shopper's target." />
      <div className="mb-4 flex gap-2">
        {(
          [
            ["deals", "Top deals"],
            ["alerts", `Price alerts (${alerts.data?.length ?? 0})`],
          ] as const
        ).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={cn("chip", tab === id && "chip-active")}>
            {label}
          </button>
        ))}
      </div>
      {error && <ErrorNote message={error} />}
      {(catalog.loading || alerts.loading) && !catalog.data && <Skeleton className="h-64" />}

      {catalog.data && tab === "deals" && (
        <Panel>
          <ul className="divide-y divide-line/70">
            {deals.slice(0, 30).map(({ p, i }) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 py-3">
                <DealScoreRing score={i.dealScore} size={48} />
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-pink">
                    {p.emoji} {p.name}
                  </Link>
                  <p className="text-xs text-midnight/50">{i.headline} · 90-day low {peso(i.lowest90)} · avg {peso(i.avg90)}</p>
                </div>
                <span className="flex items-center gap-2 text-sm font-bold">
                  <RetailerBadge id={i.bestOffer.retailer} size="xs" /> {peso(i.bestOffer.price)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {catalog.data && tab === "alerts" && (
        <Panel>
          {alertRows.length === 0 ? (
            <p className="text-sm text-midnight/50">No shopper has set a price alert yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-midnight/50">
                <tr>
                  <th className="pb-3 font-semibold">Product</th>
                  <th className="pb-3 text-right font-semibold">Best price</th>
                  <th className="pb-3 text-right font-semibold">Alerts on</th>
                  <th className="pb-3 text-right font-semibold">At target now</th>
                </tr>
              </thead>
              <tbody>
                {alertRows.map((r) => (
                  <tr key={r.p!.id} className="border-t border-line/70">
                    <td className="py-2.5 font-medium">
                      {r.p!.emoji} {r.p!.name}
                    </td>
                    <td className="py-2.5 text-right">{peso(getInsight(r.p!).bestOffer.price)}</td>
                    <td className="py-2.5 text-right">
                      {r.enabled}/{r.total}
                    </td>
                    <td className="py-2.5 text-right">
                      {r.triggered > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                          <BellRing className="h-3 w-3" /> {r.triggered}
                        </span>
                      ) : (
                        <span className="text-midnight/40">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-4 text-[11px] text-midnight/40">Sending the actual push/email notifications isn&apos;t set up yet — this shows who would be notified.</p>
        </Panel>
      )}
    </div>
  );
}
