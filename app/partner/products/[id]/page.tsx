"use client";

import { AlertTriangle, ArrowLeft, Plus, Save, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "@/components/Providers";
import { MAX_EXTRA_PHOTOS, PhotoSlides } from "@/components/admin/PhotoSlides";
import { ProductChecklist } from "@/components/admin/ProductChecklist";
import { ColorsEditor, PromotionsEditor, colorsJson, extrasProblem, parseColorRows, parsePromoRows, promotionsJson, type ColorRow, type PromoRow } from "@/components/admin/ProductExtras";
import { adminDb, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, Field, PageHeader, Panel, Skeleton, adminInput } from "@/components/admin/ui";
import { usePartner } from "@/components/partner/PartnerShell";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { CATEGORIES } from "@/lib/data/categories";
import { RETAILERS, retailerById } from "@/lib/data/retailers";
import { linkError, storeLinkWarning } from "@/lib/links";
import { changeLabels, shortDate, type ChangeSet } from "@/lib/review";
import type { Database, Json } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type OfferRow = Database["public"]["Tables"]["offers"]["Row"];
interface Offer {
  retailer_id: string;
  price: number;
  price_max: number | null;
  original_price: number;
  in_stock: boolean;
  url: string;
}
interface Draft {
  name: string;
  category_id: string;
  subcategory: string;
  image: string;
  images: string[];
  description: string;
  highlights: string;
  tags: string;
  colors: ColorRow[];
  promotions: PromoRow[];
}

const EMPTY: Draft = { name: "", category_id: "", subcategory: "", image: "", images: [], description: "", highlights: "", tags: "", colors: [], promotions: [] };
const slugify = (s: string) => s.toLowerCase().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70);
const list = (s: string, sep: RegExp) => s.split(sep).map((x) => x.trim()).filter(Boolean);
const storeName = (id: string) => retailerById(id).name;
/** Fields a partner edits; on a live product changes to these go to Lovioo's review queue. */
const CONTENT = ["name", "category_id", "subcategory", "image", "images", "description", "highlights", "tags", "colors", "promotions"] as const;
/** Compare JSON columns by content, not key order (Postgres reorders jsonb keys). */
const comparable = (k: string, v: unknown) =>
  JSON.stringify(k === "colors" ? colorsJson(parseColorRows(v as Json)) : k === "promotions" ? promotionsJson(parsePromoRows(v as Json)) : v);

/**
 * Brand Partner product editor. The brand is fixed to the partner's own; ratings, "trending" and publishing are
 * Lovioo's. New products are drafts until a Lovioo admin approves them (enforced by the database, not just this form).
 */
export default function PartnerProductEditor({ params }: { params: { id: string } }) {
  const { brand, userId } = usePartner();
  const router = useRouter();
  const isNew = params.id === "new";
  const [draft, setDraft] = useState<Draft>({ ...EMPTY, category_id: CATEGORIES[0]?.id ?? "beauty" });
  const [offers, setOffers] = useState<Offer[]>([]);
  const [note, setNote] = useState("");
  const [problem, setProblem] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, error, loading, reload } = useAdminQuery<ProductRow & { offers: OfferRow[] }>(
    async (sb) => (isNew ? { data: null, error: null } : await sb.from("products").select("*, offers(*)").eq("id", params.id).eq("brand_id", brand.id).single()),
    [params.id, brand.id],
  );
  const requests = useAdminQuery(
    async (sb) =>
      isNew
        ? { data: [], error: null }
        : await sb.from("product_change_requests").select("id, status, changes, review_note, created_at, reviewed_at").eq("product_id", params.id).order("created_at", { ascending: false }).limit(5),
    [params.id],
  );

  useEffect(() => {
    if (!data) return;
    setDraft({
      name: data.name,
      category_id: data.category_id,
      subcategory: data.subcategory,
      image: data.image,
      images: data.images ?? [],
      description: data.description,
      highlights: data.highlights.join("\n"),
      tags: data.tags.join(", "),
      colors: parseColorRows(data.colors),
      promotions: parsePromoRows(data.promotions),
    });
    setOffers(data.offers.map((o) => ({ retailer_id: o.retailer_id, price: o.price, price_max: o.price_max, original_price: o.original_price, in_stock: o.in_stock, url: o.url })));
  }, [data]);

  const live = !!data?.published;
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setOffer = (i: number, patch: Partial<Offer>) => setOffers((os) => os.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const stores = Object.values(RETAILERS).filter((r) => r.active !== false && !offers.some((o) => o.retailer_id === r.id));
  const fail = (m: string) => {
    setProblem(m);
    return null;
  };

  const row = () => ({
    name: draft.name.trim().slice(0, 160),
    category_id: draft.category_id,
    subcategory: draft.subcategory.trim().slice(0, 60),
    image: draft.image.trim(),
    images: draft.images.map((u) => u.trim()).filter(Boolean).slice(0, MAX_EXTRA_PHOTOS),
    description: draft.description.trim().slice(0, 4000),
    highlights: list(draft.highlights, /\n/).slice(0, 8),
    tags: list(draft.tags, /,/).slice(0, 12),
    colors: colorsJson(draft.colors),
    promotions: promotionsJson(draft.promotions),
  });

  const check = () => {
    setProblem("");
    if (!draft.name.trim()) return fail("Give the product a name.");
    if (!draft.image.trim()) return fail("Add a cover photo link (https://…).");
    const bad = linkError("Cover photo", draft.image) ?? draft.images.map((u, i) => linkError(`Photo ${i + 2}`, u)).find(Boolean);
    if (bad) return fail(bad);
    if (!offers.length) return fail("Add at least one store where shoppers can buy it.");
    for (const o of offers) {
      if (!o.url.trim()) return fail(`Add the product link for ${storeName(o.retailer_id)}.`);
      const e = linkError(`${storeName(o.retailer_id)} link`, o.url);
      if (e) return fail(e);
      if (!(o.price > 0)) return fail(`Enter the ${storeName(o.retailer_id)} price.`);
      if (o.price_max && o.price_max < o.price) return fail(`${storeName(o.retailer_id)}: "Up to ₱" must be at least the price.`);
    }
    const extras = extrasProblem(draft.colors, draft.promotions);
    if (extras) return fail(extras);
    return true;
  };

  const priced = (o: Offer, productId: string) => ({
    product_id: productId,
    retailer_id: o.retailer_id,
    price: Math.round(o.price),
    price_max: o.price_max && o.price_max > o.price ? Math.round(o.price_max) : null,
    original_price: Math.max(Math.round(o.original_price || 0), Math.round(o.price)),
    shipping: 0,
    in_stock: o.in_stock,
    url: o.url.trim(),
  });

  /** Draft: save everything. Returns the product id. */
  const saveDraft = async (): Promise<string | null> => {
    if (!check()) return null;
    const sb = adminDb();
    setSaving(true);
    try {
      let id = params.id;
      if (isNew) {
        const slug = `${slugify(draft.name) || "product"}-${Math.random().toString(36).slice(2, 6)}`;
        const { data: created, error } = await sb
          .from("products")
          .insert({ ...row(), slug, brand: brand.name, brand_id: brand.id, emoji: "🛍️", is_new: true, price_tracked: true, published: false })
          .select("id")
          .single();
        if (error) return fail(error.message);
        id = created.id;
      } else {
        const { error } = await sb.from("products").update({ ...row(), price_tracked: true }).eq("id", id);
        if (error) return fail(error.message);
      }
      const { error: offerError } = await sb.from("offers").upsert(offers.map((o) => priced(o, id)));
      if (offerError) return fail(`Saved, but the stores failed: ${offerError.message}`);
      const keep = offers.map((o) => o.retailer_id);
      let del = sb.from("offers").delete().eq("product_id", id);
      if (keep.length) del = del.not("retailer_id", "in", `(${keep.join(",")})`);
      const { error: delError } = await del;
      if (delError) return fail(`Saved, but removing a store failed: ${delError.message}`);
      return id;
    } finally {
      setSaving(false);
    }
  };

  const onSaveDraft = async () => {
    const id = await saveDraft();
    if (!id) return;
    toast({ title: "Draft saved", kind: "ok" });
    if (isNew) router.replace(`/partner/products/${id}`);
    else reload();
  };

  const onSubmit = async () => {
    const id = await saveDraft();
    if (!id) return;
    const { error } = await adminDb().from("products").update({ review_requested_at: new Date().toISOString(), review_requested_by: userId }).eq("id", id);
    if (error) return void fail(error.message);
    toast({ title: "Sent to Lovioo for review", body: "We'll check it and put it live. You'll see the status here.", kind: "ok" });
    if (isNew) router.replace(`/partner/products/${id}`);
    else reload();
  };

  /** Live product: prices and stock update now; other changes become a review request. */
  const onSendChanges = async () => {
    if (!data || !check()) return;
    const sb = adminDb();
    const next = row();
    const product: { [k: string]: Json } = {};
    for (const k of CONTENT) {
      const before = data[k as keyof ProductRow];
      if (comparable(k, next[k]) !== comparable(k, before)) product[k] = next[k] as Json;
    }
    const links: ChangeSet["offers"] = {};
    for (const o of offers) {
      const was = data.offers.find((x) => x.retailer_id === o.retailer_id);
      if (was && was.url !== o.url.trim()) links[o.retailer_id] = { url: o.url.trim() };
    }
    const added = offers.filter((o) => !data.offers.some((x) => x.retailer_id === o.retailer_id));
    const removed = data.offers.filter((x) => !offers.some((o) => o.retailer_id === x.retailer_id));
    if (added.length || removed.length)
      return void fail("Adding or removing a store on a live product needs Lovioo: email us, or create a new product. Undo that change to send the rest.");
    setSaving(true);
    try {
      const kept = offers.map((o) => ({ ...priced(o, data.id), url: data.offers.find((x) => x.retailer_id === o.retailer_id)!.url }));
      const { error } = await sb.from("offers").upsert(kept);
      if (error) return void fail(`Prices couldn't be saved: ${error.message}`);
      const changes: ChangeSet = { ...(Object.keys(product).length ? { product } : {}), ...(Object.keys(links).length ? { offers: links } : {}) };
      const labels = changeLabels(changes, storeName);
      if (labels.length) {
        const { error: reqError } = await sb.from("product_change_requests").insert({ product_id: data.id, requested_by: userId, changes, note: note.trim().slice(0, 1000) });
        if (reqError) return void fail(`Prices saved, but the review request failed: ${reqError.message}`);
        setNote("");
        toast({ title: "Sent to Lovioo for review", body: `We'll check: ${labels.join(", ")}. Prices and stock are live now.`, kind: "ok" });
      } else {
        toast({ title: "Prices and stock saved", kind: "ok" });
      }
      reload();
      requests.reload();
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && error) return <ErrorNote message={error} />;
  if (!isNew && loading && !data) return <Skeleton className="h-96" />;

  const pending = requests.data?.filter((r) => r.status === "pending") ?? [];
  const lastRejected = requests.data?.find((r) => r.status === "rejected");

  return (
    <div>
      <Link href="/partner/products" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink/55 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All products
      </Link>
      <PageHeader
        title={isNew ? "Add a product" : draft.name || "Product"}
        sub={
          live
            ? "Live on Lovioo. Prices and stock save straight away; other changes go to Lovioo for a quick review."
            : data?.review_requested_at
              ? `In review since ${shortDate(data.review_requested_at)}. You can still edit and resubmit.`
              : "Draft: only you and Lovioo can see it. Send it for review when it's ready."
        }
      />

      {pending.length > 0 && (
        <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Waiting for Lovioo: {pending.map((r) => changeLabels(r.changes as ChangeSet, storeName).join(", ")).join(" · ")}
        </p>
      )}
      {lastRejected && (!pending.length || lastRejected.created_at > pending[0].created_at) && lastRejected.review_note && (
        <p className="mb-4 rounded-2xl bg-coral/10 px-4 py-3 text-sm text-coral">Lovioo sent back your last change: {lastRejected.review_note}</p>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Panel title="About the product">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Product name" className="sm:col-span-2">
                <input className={adminInput} value={draft.name} onChange={(e) => set("name", e.target.value)} maxLength={160} placeholder="e.g. Glow Goodies Collagen Gummies (60 pcs)" />
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
              <Field label="Type">
                <input className={adminInput} value={draft.subcategory} onChange={(e) => set("subcategory", e.target.value)} placeholder="e.g. Sunscreen" maxLength={60} />
              </Field>
              <Field label="Description" className="sm:col-span-2" hint="Facts shoppers can check. No made-up reviews, awards or medical claims.">
                <textarea className={cn(adminInput, "min-h-[110px]")} value={draft.description} onChange={(e) => set("description", e.target.value)} maxLength={4000} />
              </Field>
              <Field label="Highlights" hint="One per line, up to 8">
                <textarea className={cn(adminInput, "min-h-[90px]")} value={draft.highlights} onChange={(e) => set("highlights", e.target.value)} />
              </Field>
              <Field label="Search words" hint="Comma separated, e.g. spf 50, tinted, oily skin">
                <textarea className={cn(adminInput, "min-h-[90px]")} value={draft.tags} onChange={(e) => set("tags", e.target.value)} />
              </Field>
            </div>
          </Panel>

          <Panel title="Colors / shades">
            <ColorsEditor rows={draft.colors} onChange={(rows) => set("colors", rows)} />
          </Panel>

          <Panel title="Promotions">
            <PromotionsEditor rows={draft.promotions} onChange={(rows) => set("promotions", rows)} />
          </Panel>

          <Panel title="Where to buy">
            <p className="-mt-1 mb-3 text-xs text-ink/55">The exact product page on each store. Use “Official store” for your own website. Prices should match the store today.</p>
            <ul className="space-y-3">
              {offers.map((o, i) => {
                const isLiveStore = live && !!data?.offers.some((x) => x.retailer_id === o.retailer_id);
                const warn = storeLinkWarning(o.retailer_id, o.url);
                return (
                  <li key={o.retailer_id} className="rounded-2xl border border-ink/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-bold">
                        <RetailerBadge id={o.retailer_id} size="xs" /> {storeName(o.retailer_id)}
                      </span>
                      <button onClick={() => setOffers((os) => os.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-lg text-coral hover:bg-coral/10" aria-label={`Remove ${storeName(o.retailer_id)}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                      <Field label="Price ₱">
                        <input type="number" min={0} inputMode="decimal" className={adminInput} value={o.price || ""} onChange={(e) => setOffer(i, { price: Number(e.target.value) })} />
                      </Field>
                      <Field label="Up to ₱ (if shades differ)">
                        <input
                          type="number"
                          min={0}
                          inputMode="decimal"
                          className={adminInput}
                          value={o.price_max ?? ""}
                          onChange={(e) => setOffer(i, { price_max: e.target.value ? Number(e.target.value) : null })}
                        />
                      </Field>
                      <Field label="Was ₱ (optional)">
                        <input type="number" min={0} inputMode="decimal" className={adminInput} value={o.original_price || ""} onChange={(e) => setOffer(i, { original_price: Number(e.target.value) })} />
                      </Field>
                      <label className="col-span-2 flex items-center gap-2 self-end pb-2 text-sm sm:col-span-1">
                        <input type="checkbox" checked={o.in_stock} onChange={(e) => setOffer(i, { in_stock: e.target.checked })} /> In stock
                      </label>
                    </div>
                    <Field label="Product link" className="mt-2" hint={isLiveStore ? "Changing a live link goes to Lovioo for review." : undefined}>
                      <input className={adminInput} value={o.url} onChange={(e) => setOffer(i, { url: e.target.value })} placeholder="https://…" />
                    </Field>
                    {warn && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-700">
                        <AlertTriangle className="h-3 w-3" /> {warn}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            {stores.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {stores.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setOffers((os) => [...os, { retailer_id: r.id, price: 0, price_max: null, original_price: 0, in_stock: true, url: "" }])}
                    className="chip !py-1.5 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> {r.name}
                  </button>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <ProductChecklist
            items={[
              { label: "Photo", done: !!draft.image.trim() && !linkError("Cover photo", draft.image) },
              { label: "Category and type", done: !!draft.category_id && !!draft.subcategory.trim() },
              { label: "Description", done: draft.description.trim().length >= 40 },
              { label: "Price at a store", done: offers.some((o) => o.price > 0) },
              { label: "Product link at the store", done: offers.some((o) => o.url.trim()) },
              { label: "Colors / shades", done: draft.colors.some((c) => c.name.trim()), optional: true },
              { label: "Promotions", done: draft.promotions.some((p) => p.text.trim()), optional: true },
            ]}
          />

          <Panel title="Photos">
            <Field label="Cover photo link" hint="https:// link to a clear product photo (square works best)">
              <input className={adminInput} value={draft.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…" />
            </Field>
            {draft.image && !linkError("Cover photo", draft.image) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.image} alt="" className="mt-3 aspect-square w-full rounded-2xl bg-pink-soft object-cover" />
            )}
            <div className="mt-4">
              <PhotoSlides cover={draft.image} photos={draft.images} onChange={(images) => set("images", images)} />
            </div>
          </Panel>

          <Panel>
            {problem && <p className="mb-3 rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral">{problem}</p>}
            {live ? (
              <>
                <Field label="Note for Lovioo (optional)">
                  <textarea className={cn(adminInput, "min-h-[70px]")} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
                </Field>
                <button onClick={onSendChanges} disabled={saving} className="btn-primary mt-3 w-full !py-2.5">
                  <Send className="h-4 w-4" /> Save prices · send changes for review
                </button>
              </>
            ) : (
              <div className="grid gap-2">
                <button onClick={onSubmit} disabled={saving} className="btn-primary w-full !py-2.5">
                  <Send className="h-4 w-4" /> {data?.review_requested_at ? "Save & resubmit for review" : "Send to Lovioo for review"}
                </button>
                <button onClick={onSaveDraft} disabled={saving} className="btn-ghost w-full !py-2.5">
                  <Save className="h-4 w-4" /> Save draft
                </button>
              </div>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-ink/50">
              Lovioo checks every product before shoppers see it. Ratings and badges are set by Lovioo, never by brands.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
