"use client";

import { ArrowUpRight, Bell, Eye, Heart, MousePointerClick, Package, RefreshCw, Store, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Panel, Skeleton } from "@/components/admin/ui";
import { categoryById } from "@/lib/data/categories";
import { retailerById } from "@/lib/data/retailers";
import { cn, compact } from "@/lib/utils";

interface Overview {
  products: number;
  published: number;
  retailers_active: number;
  offers: number;
  price_updates: number;
  users: number;
  saved: number;
  alerts: number;
  swipes: number;
  loves: number;
  views: number;
  click_outs: number;
  price_trend: { day: string; retailer_id: string; idx: number }[];
  top_categories: { category_id: string; score: number }[];
  top_products: { id: string; name: string; emoji: string; image: string; views: number; saves: number; loves: number; score: number }[];
}

const RANGES = [7, 30, 90];

export default function AdminOverview() {
  const [days, setDays] = useState(30);
  const { data, error, loading, reload } = useAdminQuery(
    async (sb) => {
      const res = await sb.rpc("admin_overview", { days });
      return { data: res.data as unknown as Overview | null, error: res.error };
    },
    [days],
  );

  const trend = useMemo(() => {
    if (!data) return { rows: [] as Record<string, number | string>[], stores: [] as string[] };
    const byDay = new Map<string, Record<string, number | string>>();
    const stores = new Set<string>();
    for (const p of data.price_trend) {
      stores.add(p.retailer_id);
      const row = byDay.get(p.day) ?? { label: new Date(p.day + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) };
      row[p.retailer_id] = Number(p.idx);
      byDay.set(p.day, row);
    }
    return { rows: [...byDay.values()], stores: [...stores] };
  }, [data]);

  const maxCat = Math.max(1, ...(data?.top_categories.map((c) => c.score) ?? [1]));

  return (
    <div>
      <PageHeader title="Overview" sub="How Lovioo is doing across products, stores and shoppers.">
        <div className="flex rounded-full bg-white p-1 shadow-sm">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setDays(r)} className={cn("rounded-full px-3.5 py-1.5 text-xs font-semibold", days === r ? "bg-pink text-white" : "text-midnight/60")}>
              Last {r} days
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat icon={Package} label="Products" value={data.products} sub={`${data.published} published · ${data.offers} offers`} />
            <Stat icon={Store} label="Active sources" value={data.retailers_active} sub="Retailers online" />
            <Stat icon={RefreshCw} label="Price updates" value={data.price_updates} sub={`Last ${days} days`} />
            <Stat icon={Users} label="Shoppers" value={data.users} sub="Accounts" />
            <Stat icon={Heart} label="Saves" value={data.saved} sub={`${data.loves} swipe loves in ${days}d`} />
            <Stat icon={Bell} label="Active price alerts" value={data.alerts} sub="Waiting for a drop" />
            <Stat icon={Eye} label="Product views" value={data.views} sub={`Last ${days} days`} />
            <Stat icon={MousePointerClick} label="Store click-outs" value={data.click_outs} sub={data.views ? `${Math.round((data.click_outs / data.views) * 100)}% of views` : "—"} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Panel title="Price trend" action={<span className="text-xs text-midnight/50">Index by store · 100 = each item&apos;s average</span>}>
              {trend.rows.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend.rows} margin={{ left: -10, right: 8, top: 8 }}>
                      <CartesianGrid stroke="#F1E6EC" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#0F274280" }} tickLine={false} axisLine={false} minTickGap={30} />
                      <YAxis tick={{ fontSize: 11, fill: "#0F274280" }} tickLine={false} axisLine={false} domain={["dataMin - 2", "dataMax + 2"]} />
                      <Tooltip formatter={(v: number, k: string) => [v, retailerById(k).name]} contentStyle={{ borderRadius: 16, border: "1px solid #E5E7EB", fontSize: 12 }} />
                      <Legend formatter={(k: string) => retailerById(k).name} wrapperStyle={{ fontSize: 12 }} />
                      {trend.stores.map((s) => (
                        <Line key={s} type="monotone" dataKey={s} stroke={retailerById(s).color} strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-midnight/50">No price history in this period.</p>
              )}
            </Panel>

            <Panel title="Top categories">
              <ul className="space-y-3">
                {data.top_categories.map((c) => {
                  const cat = categoryById(c.category_id);
                  return (
                    <li key={c.category_id}>
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {cat.emoji} {cat.name}
                        </span>
                        <span className="text-xs text-midnight/50">{c.score} pts</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-blush">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${(c.score / maxCat) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-[11px] text-midnight/40">Views plus 3 points per save.</p>
            </Panel>
          </div>

          <Panel title="Top products" action={<Link href="/admin/products" className="text-xs font-semibold text-pink">View all</Link>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-midnight/50">
                  <tr>
                    <th className="pb-2 font-semibold">#</th>
                    <th className="pb-2 font-semibold">Product</th>
                    <th className="pb-2 text-right font-semibold">Views</th>
                    <th className="pb-2 text-right font-semibold">Saves</th>
                    <th className="pb-2 text-right font-semibold">Swipe loves</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.top_products.map((p, i) => (
                    <tr key={p.id} className="border-t border-line/70">
                      <td className="py-2.5 text-midnight/50">{i + 1}</td>
                      <td className="py-2.5 font-medium">
                        <span className="mr-2">{p.emoji}</span>
                        {p.name}
                      </td>
                      <td className="py-2.5 text-right">{compact(p.views)}</td>
                      <td className="py-2.5 text-right">{compact(p.saves)}</td>
                      <td className="py-2.5 text-right">{compact(p.loves)}</td>
                      <td className="py-2.5 text-right">
                        <Link href={`/admin/products/${p.id}`} className="inline-flex text-pink" aria-label={`Edit ${p.name}`}>
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number; sub: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-soft sm:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-midnight/50">
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-pink/10 text-pink">
          <Icon className="h-3.5 w-3.5" />
        </span>
        {label}
      </div>
      <p className="mt-3 text-2xl font-extrabold sm:text-3xl">{compact(value)}</p>
      <p className="mt-0.5 text-xs text-midnight/50">{sub}</p>
    </div>
  );
}
