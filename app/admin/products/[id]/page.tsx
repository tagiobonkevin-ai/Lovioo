"use client";

import { ArrowLeft, ExternalLink, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "@/components/Providers";
import { isAdminRole, useAdminRole } from "@/components/admin/AdminShell";
import { adminDb, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, Field, PageHeader, Panel, Skeleton, Toggle, adminInput } from "@/components/admin/ui";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { CATEGORIES, VIBES } from "@/lib/data/categories";
import { RETAILERS } from "@/lib/data/retailers";
import type { Database } from "@/lib/supabase/database.types";
import { cn, peso } from "@/lib/utils";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type OfferRow = Database["public"]["Tables"]["offers"]["Row"];
type OfferDraft = Pick<OfferRow, "retailer_id" | "price" | "original_price" | "shipping" | "in_stock" | "url">;

interface Draft {
  name: string;
  slug: string;
  brand: string;
  category_id: string;
  subcategory: string;
  emoji: string;
  image: string;
  tags: string;
  vibes: string[];
  rating: number;
  review_count: number;
  description: string;
  highlights: string;
  is_new: boolean;
  trending: boolean;
  published: boolean;
  price_tracked: boolean;
}

const EMPTY: Draft = {
  name: "",
  slug: "",
  brand: "",
  category_id: "",
  subcategory: "",
  emoji: "🛍️",
  image: "",
  tags: "",
  vibes: [],
  rating: 4.5,
  review_count: 0,
  description: "",
  highlights: "",
  is_new: true,
  trending: false,
  published: false,
  price_tracked: true,
};

const slugify = (s: string) => s.toLowerCase().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const toDraft = (p: ProductRow): Draft => ({ ...p, rating: Number(p.rating), tags: p.tags.join(", "), highlights: p.highlights.join("\n") });
const list = (s: string, sep: RegExp) => s.split(sep).map((x) => x.trim()).filter(Boolean);

export default function ProductEditor({ params }: { params: { id: string } }) {
  const isNew = params.id === "new";
  // Editors draft; only admins publish, unpublish or delete (also enforced by the database).
  const canPublish = isAdminRole(useAdminRole());
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({ ...EMPTY, category_id: CATEGORIES[0]?.id ?? "" });
  const [offers, setOffers] = useState<OfferDraft[]>([]);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const { data, error, loading } = useAdminQuery<ProductRow & { offers: OfferRow[] }>(
    async (sb) => (isNew ? { data: null, error: null } : await sb.from("products").select("*, offers(*)").eq("id", params.id).single()),
    [params.id],
  );

  useEffect(() => {
    if (!data) return;
    const { offers: rows, ...product } = data;
    setDraft(toDraft(product));
    setOffers(rows.map(({ retailer_id, price, original_price, shipping, in_stock, url }) => ({ retailer_id, price, original_price, shipping, in_stock, url })));
  }, [data]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const unusedStores = Object.values(RETAILERS).filter((r) => !offers.some((o) => o.retailer_id === r.id));

  const save = async () => {
    setProblem("");
    if (!draft.name.trim() || !draft.brand.trim()) return setProblem("Name and brand are required.");
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug)) return setProblem("The URL slug can only use lowercase letters, numbers and single dashes.");
    if (draft.price_tracked && offers.some((o) => o.price <= 0))
      return setProblem('Every store offer needs a price above ₱0 — or turn off "Track prices" to list it as a "See prices" pick.');
    if (draft.published && offers.length === 0) return setProblem("Add at least one store offer before publishing.");

    const sb = adminDb();
    const row = {
      name: draft.name.trim(),
      slug: draft.slug,
      brand: draft.brand.trim(),
      category_id: draft.category_id,
      subcategory: draft.subcategory.trim(),
      emoji: draft.emoji.trim() || "🛍️",
      image: draft.image.trim(),
      tags: list(draft.tags, /,/),
      vibes: draft.vibes,
      rating: Math.min(5, Math.max(0, draft.rating)),
      review_count: Math.max(0, Math.round(draft.review_count)),
      description: draft.description.trim(),
      highlights: list(draft.highlights, /\n/),
      is_new: draft.is_new,
      trending: draft.trending,
      published: draft.published,
      price_tracked: draft.price_tracked,
    };

    setSaving(true);
    try {
      let id = params.id;
      if (isNew) {
        const { data: created, error } = await sb.from("products").insert(row).select("id").single();
        if (error) return setProblem(error.message);
        id = created.id;
      } else {
        const { error } = await sb.from("products").update(row).eq("id", id);
        if (error) return setProblem(error.message);
      }

      if (offers.length) {
        const original = (o: OfferDraft) => Math.max(o.original_price, o.price);
        // "See prices" picks store no price, so nothing lands in the price history.
        const priced = (o: OfferDraft) => (draft.price_tracked ? { ...o, original_price: original(o) } : { ...o, price: 0, original_price: 0, shipping: 0 });
        const { error } = await sb.from("offers").upsert(offers.map((o) => ({ ...priced(o), product_id: id })));
        if (error) return setProblem(`Product saved, but offers failed: ${error.message}`);
      }
      const keep = offers.map((o) => o.retailer_id);
      let del = sb.from("offers").delete().eq("product_id", id);
      if (keep.length) del = del.not("retailer_id", "in", `(${keep.join(",")})`);
      const { error: delError } = await del;
      if (delError) return setProblem(`Product saved, but removing old offers failed: ${delError.message}`);

      toast({ title: isNew ? "Product created" : "Product saved", body: "The shopper site picks it up within a minute.", kind: "ok" });
      if (isNew) router.replace(`/admin/products/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete “${draft.name}”? This also removes its offers, price history, saves and alerts.`)) return;
    const { error } = await adminDb().from("products").delete().eq("id", params.id);
    if (error) return setProblem(error.message);
    toast({ title: "Product deleted", kind: "ok" });
    router.push("/admin/products");
  };

  if (error) return <ErrorNote message={error} />;
  if (!isNew && loading && !data) return <Skeleton className="h-96" />;

  return (
    <div>
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1 text-sm text-midnight/60 hover:text-pink">
        <ArrowLeft className="h-4 w-4" /> Products
      </Link>
      <PageHeader title={isNew ? "Add product" : draft.name || "Edit product"}>
        {!isNew && draft.published && (
          <Link href={`/product/${draft.slug}`} target="_blank" className="btn-ghost">
            View live <ExternalLink className="h-4 w-4" />
          </Link>
        )}
        {!isNew && canPublish && (
          <button onClick={remove} className="btn border border-coral/30 bg-white text-coral hover:bg-coral/5">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        )}
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving…" : isNew ? "Create product" : "Save changes"}
        </button>
      </PageHeader>
      {problem && <p className="mb-4 rounded-2xl bg-coral/10 p-3 text-sm font-medium text-coral">{problem}</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" className="sm:col-span-2">
                <input
                  className={adminInput}
                  value={draft.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (!slugTouched) set("slug", slugify(e.target.value));
                  }}
                />
              </Field>
              <Field label="URL slug" hint={`lovioo.com/product/${draft.slug || "…"}`}>
                <input
                  className={adminInput}
                  value={draft.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value);
                  }}
                />
              </Field>
              <Field label="Brand">
                <input className={adminInput} value={draft.brand} onChange={(e) => set("brand", e.target.value)} />
              </Field>
              <Field label="Category">
                <select className={adminInput} value={draft.category_id} onChange={(e) => set("category_id", e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Subcategory">
                <input className={adminInput} value={draft.subcategory} onChange={(e) => set("subcategory", e.target.value)} placeholder="e.g. Sneakers" />
              </Field>
              <Field label="Tags" hint="Comma separated — used by search, Lovioo AI and recommendations" className="sm:col-span-2">
                <input className={adminInput} value={draft.tags} onChange={(e) => set("tags", e.target.value)} placeholder="wireless, noise cancelling" />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea rows={3} className={adminInput} value={draft.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
              <Field label="Highlights" hint="One per line" className="sm:col-span-2">
                <textarea rows={3} className={adminInput} value={draft.highlights} onChange={(e) => set("highlights", e.target.value)} />
              </Field>
              <Field label="Rating (0–5)">
                <input type="number" step="0.1" min={0} max={5} className={adminInput} value={draft.rating} onChange={(e) => set("rating", Number(e.target.value))} />
              </Field>
              <Field label="Review count">
                <input type="number" min={0} className={adminInput} value={draft.review_count} onChange={(e) => set("review_count", Number(e.target.value))} />
              </Field>
            </div>
          </Panel>

          <Panel
            title="Store offers"
            action={
              unusedStores.length > 0 && (
                <select
                  className={cn(adminInput, "!w-auto")}
                  value=""
                  onChange={(e) =>
                    e.target.value &&
                    setOffers((o) => [...o, { retailer_id: e.target.value, price: 0, original_price: 0, shipping: 0, in_stock: true, url: "" }])
                  }
                  aria-label="Add a store"
                >
                  <option value="">+ Add store</option>
                  {unusedStores.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                      {r.active === false ? " (inactive)" : ""}
                    </option>
                  ))}
                </select>
              )
            }
          >
            {offers.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-midnight/50">
                <Plus className="h-4 w-4" /> Add the stores that sell this product.
              </p>
            ) : (
              <div className="space-y-3">
                {offers.map((o, i) => {
                  const update = (patch: Partial<OfferDraft>) => setOffers((all) => all.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                  return (
                    <div
                      key={o.retailer_id}
                      className={cn("grid gap-3 rounded-2xl border border-line p-3 sm:items-end", draft.price_tracked ? "sm:grid-cols-[150px_1fr_1fr_1fr_auto]" : "sm:grid-cols-[1fr_auto]")}
                    >
                      <div className="flex items-center gap-2 pb-2">
                        <RetailerBadge id={o.retailer_id} withName size="sm" />
                      </div>
                      {draft.price_tracked && (
                        <>
                          <Field label="Price ₱">
                            <input type="number" min={0} className={adminInput} value={o.price} onChange={(e) => update({ price: Number(e.target.value) })} />
                          </Field>
                          <Field label="Was ₱">
                            <input type="number" min={0} className={adminInput} value={o.original_price} onChange={(e) => update({ original_price: Number(e.target.value) })} />
                          </Field>
                          <Field label="Shipping ₱">
                            <input type="number" min={0} className={adminInput} value={o.shipping} onChange={(e) => update({ shipping: Number(e.target.value) })} />
                          </Field>
                        </>
                      )}
                      <div className="flex items-center gap-3 pb-1.5">
                        <span className="flex items-center gap-2 text-xs text-midnight/60">
                          <Toggle on={o.in_stock} onChange={() => update({ in_stock: !o.in_stock })} label="In stock" /> In stock
                        </span>
                        <button onClick={() => setOffers((all) => all.filter((_, j) => j !== i))} className="text-midnight/40 hover:text-coral" aria-label={`Remove ${o.retailer_id}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <Field
                        label="Product link at store"
                        hint="Paste the product's affiliate link here to earn on this exact product. Left empty, the store's affiliate link is used."
                        className={draft.price_tracked ? "sm:col-span-5" : "sm:col-span-2"}
                      >
                        <input className={adminInput} value={o.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://…" />
                      </Field>
                    </div>
                  );
                })}
                <p className="text-[11px] text-midnight/40">
                  {draft.price_tracked
                    ? "Each price change is recorded in the price history for today."
                    : 'Price tracking is off: shoppers see "See prices" and compare live listings on each store.'}
                </p>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Visibility">
            <div className="space-y-3 text-sm">
              {!canPublish && (
                <p className="rounded-2xl bg-lavender p-3 text-xs text-midnight/70">
                  {draft.published ? "Live on the shopper site. Your edits show up within a minute." : "Draft: an admin will review and publish it."}
                </p>
              )}
              {(
                [
                  ...(canPublish ? ([["published", "Published on the shopper site"]] as const) : []),
                  ["trending", "Mark as trending 🔥"],
                  ["is_new", "Show NEW badge"],
                  ["price_tracked", "Track prices (off = \"See prices\" pick)"],
                ] as const
              ).map(([k, label]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <span>{label}</span>
                  <Toggle on={draft[k]} onChange={() => set(k, !draft[k])} label={label} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Media">
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <Field label="Emoji">
                <input className={cn(adminInput, "text-center text-xl")} value={draft.emoji} onChange={(e) => set("emoji", e.target.value)} />
              </Field>
              <Field label="Image URL">
                <input
                  className={adminInput}
                  value={draft.image}
                  onChange={(e) => {
                    setImageFailed(false);
                    set("image", e.target.value);
                  }}
                  placeholder="https://…"
                />
              </Field>
            </div>
            <div className="mt-4 grid aspect-square place-items-center overflow-hidden rounded-2xl bg-blush text-7xl">
              {draft.image && !imageFailed ? <img src={draft.image} alt="" className="h-full w-full object-cover" onError={() => setImageFailed(true)} /> : draft.emoji}
            </div>
            <p className="mt-2 text-[11px] text-midnight/40">If the image can&apos;t load, shoppers see the emoji tile.</p>
          </Panel>

          <Panel title="Vibes" action={<span className="text-xs text-midnight/50">Swipe filters</span>}>
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => {
                const on = draft.vibes.includes(v.id);
                return (
                  <button key={v.id} onClick={() => set("vibes", on ? draft.vibes.filter((x) => x !== v.id) : [...draft.vibes, v.id])} className={cn("chip", on && "chip-active")}>
                    {v.emoji} {v.label}
                  </button>
                );
              })}
            </div>
          </Panel>

          {offers.length > 0 && draft.price_tracked && (
            <Panel title="Summary">
              <p className="text-sm text-midnight/70">
                Lowest price <b>{peso(Math.min(...offers.map((o) => o.price)))}</b> across {offers.length} store{offers.length > 1 ? "s" : ""}.
              </p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
