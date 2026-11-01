"use client";

import { Plus, Trash2 } from "lucide-react";
import { adminInput } from "@/components/admin/ui";
import { RETAILERS } from "@/lib/data/retailers";
import { linkError } from "@/lib/links";
import type { Json } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

/** Rows as stored in products.colors / products.promotions (snake_case JSON). */
export interface ColorRow {
  name: string;
  hex: string;
  image: string;
}
export interface PromoRow {
  text: string;
  retailer_id: string;
  ends_on: string;
}

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function parseColorRows(v: Json | undefined): ColorRow[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((c) => {
    const o = (c ?? {}) as Partial<ColorRow>;
    return typeof o.name === "string" ? [{ name: o.name, hex: o.hex ?? "", image: o.image ?? "" }] : [];
  });
}
export function parsePromoRows(v: Json | undefined): PromoRow[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((p) => {
    const o = (p ?? {}) as Partial<PromoRow>;
    return typeof o.text === "string" ? [{ text: o.text, retailer_id: o.retailer_id ?? "", ends_on: o.ends_on ?? "" }] : [];
  });
}

/** Clean rows for saving: empty rows dropped, empty optional fields removed. */
export function colorsJson(rows: ColorRow[]): Json {
  return rows
    .filter((c) => c.name.trim())
    .slice(0, 24)
    .map((c) => ({ name: c.name.trim().slice(0, 40), ...(c.hex ? { hex: c.hex } : {}), ...(c.image.trim() ? { image: c.image.trim() } : {}) }));
}
export function promotionsJson(rows: PromoRow[]): Json {
  return rows
    .filter((p) => p.text.trim())
    .slice(0, 6)
    .map((p) => ({ text: p.text.trim().slice(0, 80), ...(p.retailer_id ? { retailer_id: p.retailer_id } : {}), ...(p.ends_on ? { ends_on: p.ends_on } : {}) }));
}

/** The first problem with the colors or promotions, or null. */
export function extrasProblem(colors: ColorRow[], promos: PromoRow[]): string | null {
  for (const c of colors) {
    if (!c.name.trim()) continue;
    if (c.hex && !HEX.test(c.hex)) return `Color “${c.name}”: the swatch must look like #C98B7B.`;
    if (c.image.trim()) {
      const e = linkError(`Photo for “${c.name}”`, c.image);
      if (e) return e;
    }
  }
  if (colors.filter((c) => c.name.trim()).length > 24) return "Up to 24 colors.";
  if (promos.filter((p) => p.text.trim()).length > 6) return "Up to 6 promotions.";
  return null;
}

/** Editor for shades / color options: name, swatch color and an optional photo. */
export function ColorsEditor({ rows, onChange, disabled }: { rows: ColorRow[]; onChange: (rows: ColorRow[]) => void; disabled?: boolean }) {
  const set = (i: number, patch: Partial<ColorRow>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div>
      <ul className="space-y-2">
        {rows.map((c, i) => (
          <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.4fr)_auto]">
            <input
              type="color"
              value={HEX.test(c.hex) ? c.hex : "#f3e8ee"}
              onChange={(e) => set(i, { hex: e.target.value })}
              disabled={disabled}
              className="h-9 w-10 cursor-pointer rounded-lg border border-ink/15 bg-white p-0.5"
              aria-label={`Swatch for ${c.name || "color"}`}
            />
            <input className={adminInput} value={c.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="Shade name, e.g. Nude Shock" maxLength={40} disabled={disabled} />
            <input
              className={cn(adminInput, "col-span-2 sm:col-span-1")}
              value={c.image}
              onChange={(e) => set(i, { image: e.target.value })}
              placeholder="Photo link (optional, https://…)"
              disabled={disabled}
            />
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
              disabled={disabled}
              className="row-start-1 grid h-9 w-9 place-items-center justify-self-end rounded-lg text-coral hover:bg-coral/10 sm:row-start-auto"
              aria-label={`Remove ${c.name || "color"}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      {rows.length < 24 && !disabled && (
        <button type="button" onClick={() => onChange([...rows, { name: "", hex: "", image: "" }])} className="btn-ghost mt-2 !px-3 !py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add color
        </button>
      )}
    </div>
  );
}

/** Editor for store promotions: text, which store, and an optional end date. */
export function PromotionsEditor({ rows, onChange, disabled }: { rows: PromoRow[]; onChange: (rows: PromoRow[]) => void; disabled?: boolean }) {
  const set = (i: number, patch: Partial<PromoRow>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const stores = Object.values(RETAILERS).filter((r) => r.active !== false);
  return (
    <div>
      <ul className="space-y-2">
        {rows.map((p, i) => (
          <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_150px_auto]">
            <input className={adminInput} value={p.text} onChange={(e) => set(i, { text: e.target.value })} placeholder="e.g. Buy 2 Gift 1" maxLength={80} disabled={disabled} />
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
              disabled={disabled}
              className="grid h-9 w-9 place-items-center rounded-lg text-coral hover:bg-coral/10 sm:order-last"
              aria-label="Remove promotion"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <select className={adminInput} value={p.retailer_id} onChange={(e) => set(i, { retailer_id: e.target.value })} disabled={disabled} aria-label="Store">
              <option value="">Any store</option>
              {stores.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <input type="date" className={adminInput} value={p.ends_on} onChange={(e) => set(i, { ends_on: e.target.value })} disabled={disabled} aria-label="Ends on" />
          </li>
        ))}
      </ul>
      {rows.length < 6 && !disabled && (
        <button type="button" onClick={() => onChange([...rows, { text: "", retailer_id: "", ends_on: "" }])} className="btn-ghost mt-2 !px-3 !py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add promotion
        </button>
      )}
      <p className="mt-1.5 text-[11px] text-ink/45">Only promotions the store is running now. Expired ones hide themselves after the end date.</p>
    </div>
  );
}
