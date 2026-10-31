"use client";

import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Skeleton } from "@/components/admin/ui";
import { usePartner } from "@/components/partner/PartnerShell";
import { PartnerStatsView, type PartnerStats } from "@/components/partner/PartnerStatsView";
import { cn } from "@/lib/utils";

const RANGES = [7, 30, 90];

/** Brand Partner dashboard: how shoppers respond to the brand's products on Lovioo. Totals only, never who. */
export default function PartnerDashboard() {
  const { brand } = usePartner();
  const [days, setDays] = useState(30);
  const { data, error, loading, reload } = useAdminQuery(
    async (sb) => {
      const res = await sb.rpc("partner_stats", { brand: brand.id, days });
      return { data: res.data as unknown as PartnerStats | null, error: res.error };
    },
    [brand.id, days],
  );

  return (
    <div>
      <PageHeader title={`Hi, ${brand.name}`} sub="How shoppers respond to your products on Lovioo. You see totals only; shoppers' names are never shared.">
        <div className="flex rounded-full bg-white p-1 shadow-sm">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setDays(r)} className={cn("rounded-full px-3.5 py-1.5 text-xs font-semibold", days === r ? "bg-pink text-white" : "text-ink/60")}>
              {r} days
            </button>
          ))}
        </div>
        <button onClick={reload} className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm" aria-label="Refresh">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </PageHeader>
      {error && <ErrorNote message={error} />}
      {!data && loading && <Skeleton className="h-96" />}
      {data && (
        <div className="space-y-6">
          {Number(data.products.total) === 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-pink-soft/60 p-5">
              <div>
                <p className="font-bold">Add your first product</p>
                <p className="text-sm text-ink/60">Lovioo reviews it, then it goes live for shoppers and starts counting here.</p>
              </div>
              <Link href="/partner/products/new" className="btn-primary !py-2">
                <Plus className="h-4 w-4" /> Add product
              </Link>
            </div>
          )}
          <PartnerStatsView stats={data} />
        </div>
      )}
    </div>
  );
}
