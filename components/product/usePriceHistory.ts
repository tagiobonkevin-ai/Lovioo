"use client";

import { useEffect, useState } from "react";
import { priceHistory, retailerHistory } from "@/lib/insights";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { PricePoint, Product } from "@/lib/types";

export type StoreRow = { label: string } & Record<string, number | string>;

interface History {
  status: "loading" | "ready" | "error";
  lowest: PricePoint[];
  byStore: StoreRow[];
  error?: string;
}

const label = (day: string) =>
  new Date(day + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** 90 days of prices: real rows from Supabase, or the illustrative series in demo mode. */
export function usePriceHistory(product: Product): History {
  const [state, setState] = useState<History>(() =>
    isSupabaseConfigured
      ? { status: "loading", lowest: [], byStore: [] }
      : { status: "ready", lowest: priceHistory(product), byStore: retailerHistory(product, 90) as StoreRow[] },
  );

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let cancelled = false;
    const since = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
    const stores = new Set(product.offers.map((o) => o.retailer));
    sb.from("price_history")
      .select("day, retailer_id, price")
      .eq("product_id", product.id)
      .gt("day", since)
      .order("day")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) return setState({ status: "error", lowest: [], byStore: [], error: error.message });
        const byDay = new Map<string, StoreRow>();
        for (const r of data) {
          if (!stores.has(r.retailer_id)) continue;
          const row = byDay.get(r.day) ?? { label: label(r.day) };
          row[r.retailer_id] = r.price;
          byDay.set(r.day, row);
        }
        const days = [...byDay.entries()];
        setState({
          status: "ready",
          byStore: days.map(([, row]) => row),
          lowest: days.map(([day, row]) => ({
            date: day,
            label: row.label,
            price: Math.min(...[...stores].map((s) => row[s]).filter((v): v is number => typeof v === "number")),
          })),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [product]);

  return state;
}
