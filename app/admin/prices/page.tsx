"use client";

import { ClipboardPaste, Save, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "@/components/Providers";
import { adminDb, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Panel, Skeleton, Toggle, adminInput } from "@/components/admin/ui";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { cn } from "@/lib/utils";

type OfferRow = { retailer_id: string; price: number; original_price: number; shipping: number; in_stock: boolean; url: string };
type Row = { id: string; slug: string; name: string; brand: string; emoji: string; price_tracked: boolean; published: boolean; offers: OfferRow[] };
type Edit = { price: number; original_price: number; in_stock: boolean };

const key = (pid: string, rid: string) => `${pid}:${rid}`;
const STORE_ORDER = ["shopee", "lazada", "tiktok", "amazon"];

/** Bulk price entry: fill in store prices for many products at once, e.g. the "See prices" picks. */
export default function PriceList() {
  const { data, error, loading, reload } = useAdminQuery<Row[]>((sb) =>
    sb.from("products").select("id, slug, name, brand, emoji, price_tracked, published, offers(retailer_id, price, original_price, shipping, in_stock, url)").order("sort").order("created_at"),
  );
  const [filter, setFilter] = useState<"picks" | "all">("picks");
  const [q, setQ] = useState("");
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [paste, setPaste] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (p) => (filter === "all" || !p.price_tracked) && (!q || `${p.name} ${p.brand} ${p.slug}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [data, filter, q],
  );
  const value = (p: Row, o: OfferRow): Edit => edits[key(p.id, o.retailer_id)] ?? { price: o.price, original_price: o.original_price, in_stock: o.in_stock };
  const edit = (p: Row, o: OfferRow, patch: Partial<Edit>) => setEdits((e) => ({ ...e, [key(p.id, o.retailer_id)]: { ...value(p, o), ...patch } }));
  const dirtyProducts = (data ?? []).filter((p) => p.offers.some((o) => edits[key(p.id, o.retailer_id)]));

  /** Lines like "lip-tint, 199, 189" or "Lip Tint<TAB>199<TAB>189": product slug or name, then Shopee, then Lazada prices. */
  const applyPaste = () => {
    let matched = 0;
    const unmatched: string[] = [];
    const next = { ...edits };
    paste
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        // Tabs (spreadsheets) split cleanly; with commas, prices are the trailing numbers so names like "10,000mAh" survive.
        const cells = (line.includes("\t") ? line.split("\t") : line.split(/[,;]/)).map((c) => c.trim());
        const nums: string[] = [];
        while (cells.length > 1 && /^₱?\s*[\d.]+$/.test(cells[cells.length - 1])) nums.unshift(cells.pop()!);
        const name = cells.join(line.includes("\t") ? " " : ",").trim();
        const p = (data ?? []).find((r) => r.slug === name.toLowerCase() || r.name.toLowerCase() === name.toLowerCase());
        const prices = nums.map((n) => Number(n.replace(/[₱,\s]/g, ""))).filter((n) => Number.isFinite(n) && n > 0);
        if (!p || !prices.length) return unmatched.push(name);
        const offers = [...p.offers].sort((a, b) => STORE_ORDER.indexOf(a.retailer_id) - STORE_ORDER.indexOf(b.retailer_id));
        prices.forEach((price, i) => {
          const o = offers[i];
          if (o) next[key(p.id, o.retailer_id)] = { ...(next[key(p.id, o.retailer_id)] ?? { original_price: o.original_price, in_stock: o.in_stock }), price };
        });
        matched++;
      });
    setEdits(next);
    toast({ title: `Filled ${matched} product${matched === 1 ? "" : "s"}`, body: unmatched.length ? `Not found: ${unmatched.slice(0, 4).join(", ")}${unmatched.length > 4 ? "…" : ""}` : "Review, then Save", kind: unmatched.length ? "error" : "ok" });
  };

  const save = async () => {
    setSaving(true);
    const sb = adminDb();
    let ok = 0;
    let switched = 0;
    const failed: string[] = [];
    try {
      for (const p of dirtyProducts) {
        const offers = p.offers.map((o) => {
          const v = value(p, o);
          return { product_id: p.id, ...o, price: v.price, original_price: Math.max(v.original_price, v.price), in_stock: v.in_stock };
        });
        const { error: offerError } = await sb.from("offers").upsert(offers);
        if (offerError) {
          failed.push(`${p.name}: ${offerError.message}`);
          continue;
        }
        // A pick with a price at every store becomes a normal tracked product.
        if (!p.price_tracked && offers.every((o) => o.price > 0)) {
          const { error: trackError } = await sb.from("products").update({ price_tracked: true }).eq("id", p.id);
          if (trackError) failed.push(`${p.name}: ${trackError.message}`);
          else switched++;
        }
        ok++;
      }
    } finally {
      setSaving(false);
    }
    if (failed.length) toast({ title: `Saved ${ok}, ${failed.length} failed`, body: failed[0], kind: "error" });
    else toast({ title: `Saved prices for ${ok} product${ok === 1 ? "" : "s"}`, body: switched ? `${switched} now show real prices` : "Shoppers see them within a minute", kind: "ok" });
    setEdits({});
    reload();
  };

  return (
    <div>
      <PageHeader title="Price list" sub="Enter store prices in bulk. When every store of a “See prices” pick has a price, it starts showing real prices to shoppers.">
        <button onClick={save} disabled={!dirtyProducts.length || saving} className="btn-primary">
          <Save className="h-4 w-4" /> {saving ? "Saving…" : `Save ${dirtyProducts.length || ""}`.trim()}
        </button>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel>
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="flex rounded-full bg-ink/[0.03] p-1">
              {(
                [
                  ["picks", "“See prices” picks"],
                  ["all", "All products"],
                ] as const
              ).map(([f, label]) => (
                <button key={f} onClick={() => setFilter(f)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", filter === f ? "bg-pink text-white" : "text-ink/60")}>
                  {label}
                </button>
              ))}
            </div>
            <label className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className={cn(adminInput, "pl-9")} aria-label="Search products" />
            </label>
          </div>
          {error && <ErrorNote message={error} />}
          {loading && !data && <Skeleton className="h-64" />}
          {data && rows.length === 0 && <p className="py-8 text-center text-sm text-ink/50">{filter === "picks" ? "Every product has prices. 🎉" : "No products match."}</p>}
          <ul className="divide-y divide-ink/10/70">
            {rows.slice(0, 200).map((p) => (
              <li key={p.id} className="grid gap-3 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <Link href={`/admin/products/${p.id}`} className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blush text-xl">{p.emoji}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold hover:text-pink">{p.name}</span>
                    <span className="text-xs text-ink/50">
                      {p.brand} · {p.price_tracked ? "prices shown" : "“See prices”"}
                      {!p.published && " · draft"}
                    </span>
                  </span>
                </Link>
                <div className="flex flex-wrap gap-2">
                  {[...p.offers]
                    .sort((a, b) => STORE_ORDER.indexOf(a.retailer_id) - STORE_ORDER.indexOf(b.retailer_id))
                    .map((o) => {
                      const v = value(p, o);
                      const dirty = !!edits[key(p.id, o.retailer_id)];
                      return (
                        <div key={o.retailer_id} className={cn("flex items-center gap-2 rounded-2xl border px-2.5 py-1.5", dirty ? "border-pink bg-pink/5" : "border-ink/15")}>
                          <RetailerBadge id={o.retailer_id} size="xs" />
                          <label className="text-[10px] text-ink/50">
                            ₱
                            <input
                              type="number"
                              min={0}
                              inputMode="decimal"
                              value={v.price || ""}
                              placeholder="price"
                              onChange={(e) => edit(p, o, { price: Number(e.target.value) })}
                              className="ml-0.5 w-20 rounded-lg border border-ink/15 px-1.5 py-1 text-sm text-ink outline-none focus:border-pink"
                              aria-label={`${o.retailer_id} price for ${p.name}`}
                            />
                          </label>
                          <label className="text-[10px] text-ink/50">
                            was
                            <input
                              type="number"
                              min={0}
                              inputMode="decimal"
                              value={v.original_price || ""}
                              placeholder="—"
                              onChange={(e) => edit(p, o, { original_price: Number(e.target.value) })}
                              className="ml-1 w-16 rounded-lg border border-ink/15 px-1.5 py-1 text-xs text-ink outline-none focus:border-pink"
                              aria-label={`${o.retailer_id} original price for ${p.name}`}
                            />
                          </label>
                          <Toggle on={v.in_stock} onChange={() => edit(p, o, { in_stock: !v.in_stock })} label={`${o.retailer_id} in stock for ${p.name}`} />
                        </div>
                      );
                    })}
                  {p.offers.length === 0 && <span className="text-xs text-coral">No stores yet — add them in the product editor</span>}
                </div>
              </li>
            ))}
          </ul>
          {rows.length > 200 && <p className="pt-3 text-center text-xs text-ink/50">Showing 200 of {rows.length}. Search to narrow down.</p>}
        </Panel>

        <Panel title="Paste from a spreadsheet" action={<ClipboardPaste className="h-4 w-4 text-ink/40" />}>
          <p className="text-xs text-ink/60">
            One product per line: the product&apos;s URL slug or exact name, then the Shopee price, then the Lazada price. Copy straight from Google Sheets or Excel.
          </p>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={8}
            placeholder={"lip-tint\t199\t189\nPimple Patches, 129, 119"}
            className={cn(adminInput, "mt-3 font-mono text-xs")}
            aria-label="Pasted prices"
          />
          <button onClick={applyPaste} disabled={!paste.trim() || !data} className="btn-dark mt-3 w-full !py-2">
            Fill the list
          </button>
          <p className="mt-2 text-[11px] text-ink/40">Nothing is saved until you press Save. Prices you fill in show up highlighted.</p>
        </Panel>
      </div>
    </div>
  );
}
