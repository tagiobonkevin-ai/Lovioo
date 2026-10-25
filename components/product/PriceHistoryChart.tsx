"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { retailerById } from "@/lib/data/retailers";
import { getInsight } from "@/lib/insights";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";
import { cn, peso } from "@/lib/utils";
import { usePriceHistory } from "./usePriceHistory";

const RANGES = [
  { id: 30, label: "30D" },
  { id: 90, label: "90D" },
];

const fmtAxis = (v: number) => (v >= 1000 ? `₱${(v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, "")}K` : `₱${Math.round(v)}`);

export function PriceHistoryChart({ product }: { product: Product }) {
  const [range, setRange] = useState(90);
  const [mode, setMode] = useState<"lowest" | "stores">("lowest");
  const insight = getInsight(product);
  const history = usePriceHistory(product);
  const data = useMemo(() => history.lowest.slice(-range), [history.lowest, range]);
  const storeData = useMemo(() => history.byStore.slice(-range), [history.byStore, range]);
  const prices = data.map((d) => d.price);

  if (history.status === "loading") return <div className="h-80 animate-pulse rounded-3xl bg-cream" aria-label="Loading price history" />;
  if (history.status === "error") return <p className="rounded-2xl bg-coral/10 p-4 text-sm text-coral">Couldn&apos;t load price history: {history.error}</p>;
  if (!prices.length) return <p className="rounded-2xl bg-cream p-4 text-sm text-midnight/60">No price history yet — it builds up as prices are tracked.</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-blush p-1">
          {(["lowest", "stores"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", mode === m ? "bg-white text-pink shadow-sm" : "text-midnight/60")}>
              {m === "lowest" ? "Lowest price" : "By store"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button key={r.id} onClick={() => setRange(r.id)} className={cn("chip !py-1", range === r.id && "chip-active")}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Stat label="Lowest" value={peso(Math.min(...prices))} tone="text-emerald-600" />
        <Stat label="Average" value={peso(prices.reduce((a, b) => a + b, 0) / prices.length)} />
        <Stat label="Highest" value={peso(Math.max(...prices))} tone="text-coral" />
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {mode === "lowest" ? (
            <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="ph" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF2D9A" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#FF2D9A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F1E6EC" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#0F274280" }} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11, fill: "#0F274280" }} tickLine={false} axisLine={false} width={52} domain={["dataMin - 200", "dataMax + 200"]} />
              <Tooltip formatter={(v: number) => [peso(v), "Lowest price"]} contentStyle={{ borderRadius: 16, border: "1px solid #E5E7EB", fontSize: 12 }} />
              <Area type="monotone" dataKey="price" stroke="#FF2D9A" strokeWidth={2.5} fill="url(#ph)" />
            </AreaChart>
          ) : (
            <LineChart data={storeData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid stroke="#F1E6EC" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#0F274280" }} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11, fill: "#0F274280" }} tickLine={false} axisLine={false} width={52} domain={["dataMin - 200", "dataMax + 200"]} />
              <Tooltip formatter={(v: number, k: string) => [peso(v), retailerById(k).name]} contentStyle={{ borderRadius: 16, border: "1px solid #E5E7EB", fontSize: 12 }} />
              {product.offers.map((o) => (
                <Line key={o.retailer} type="monotone" dataKey={o.retailer} stroke={retailerById(o.retailer).color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      {mode === "stores" && (
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          {product.offers.map((o) => (
            <span key={o.retailer} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full" style={{ background: retailerById(o.retailer).color }} /> {retailerById(o.retailer).name}
            </span>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-midnight/50">90-day low {peso(insight.lowest90)} · average {peso(insight.avg90)}. {isSupabaseConfigured ? "Updated whenever a store price changes." : "Illustrative demo history."}</p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl bg-cream p-3">
      <p className="text-[11px] uppercase tracking-wider text-midnight/50">{label}</p>
      <p className={cn("text-sm font-bold sm:text-base", tone)}>{value}</p>
    </div>
  );
}
