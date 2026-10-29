"use client";

import { AlertTriangle, ArrowLeft, Clock, ExternalLink, Plus, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "@/components/Providers";
import { isAdminRole, useAdminRole } from "@/components/admin/AdminShell";
import { adminDb, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, Field, PageHeader, Panel, Skeleton, Toggle, adminInput } from "@/components/admin/ui";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { CATEGORIES, VIBES } from "@/lib/data/categories";
import { RETAILERS, retailerById } from "@/lib/data/retailers";
import { linkError, storeLinkWarning } from "@/lib/links";
import { MAX_EXTRA_PHOTOS, PhotoSlides } from "@/components/admin/PhotoSlides";
import { CONTENT_KEYS, asChangeSet, changeLabels, shortDate, type ChangeSet } from "@/lib/review";
import type { Database, Json } from "@/lib/supabase/database.types";
import { cn, peso } from "@/lib/utils";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type OfferRow = Database["public"]["Tables"]["offers"]["Row"];
type OfferDraft = Pick<OfferRow, "retailer_id" | "price" | "original_price" | "shipping" | "in_stock" | "url">;
type RequestRow = Database["public"]["Tables"]["product_change_requests"]["Row"];

interface Draft {
  name: string;
  slug: string;
  brand: string;
  category_id: string;
  subcategory: string;
  emoji: string;
  image: string;
  images: string[];
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
  brand_id: string | null;
}

const EMPTY: Draft = {
  name: "",
  slug: "",
  brand: "",
  category_id: "",
  subcategory: "",
  emoji: "🛍️",
  image: "",
  images: [],
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
  brand_id: null,
};

const slugify = (s: string) => s.toLowerCase().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const toDraft = (p: ProductRow): Draft => ({ ...p, images: p.images ?? [], rating: Number(p.rating), tags: p.tags.join(", "), highlights: p.highlights.join("\n") });
const list = (s: string, sep: RegExp) => s.split(sep).map((x) => x.trim()).filter(Boolean);
const storeName = (id: string) => retailerById(id).name;

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
  const [note, setNote] = useState("");

  const { data, error, loading, reload } = useAdminQuery<ProductRow & { offers: OfferRow[] }>(
    async (sb) => (isNew ? { data: null, error: null } : await sb.from("products").select("*, offers(*)").eq("id", params.id).single()),
    [params.id],
  );

  useEffect(() => {
    if (!data) return;
    const { offers: rows, ...product } = data;
    setDraft(toDraft(product));
    setOffers(rows.map(({ retailer_id, price, original_price, shipping, in_stock, url }) => ({ retailer_id, price, original_price, shipping, in_stock, url })));
  }, [data]);

  const brands = useAdminQuery((sb) => sb.from("brands").select("id, name").order("name"));
  // Editors see their own requests, admins see everyone's (RLS).
  const requests = useAdminQuery<RequestRow[]>(
    async (sb) =>
      isNew ? { data: [], error: null } : await sb.from("product_change_requests").select("*").eq("product_id", params.id).order("created_at", { ascending: false }).limit(10),
    [params.id],
  );
  const pending = requests.data?.filter((r) => r.status === "pending") ?? [];
  const latest = requests.data?.[0];
  // An editor's changes to a live product: prices and stock save directly, everything else goes to review.
  const liveLocked = !canPublish && !isNew && !!data?.published;
  const imageProblem = linkError("Image URL", draft.image);
  const photosProblem = draft.images.map((u, i) => linkError(`Photo ${i + 2}`, u)).find(Boolean) ?? null;
  const offerProblem = (o: OfferDraft) => linkError(`${storeName(o.retailer_id)} link`, o.url);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const unusedStores = Object.values(RETAILERS).filter((r) => !offers.some((o) => o.retailer_id === r.id));

  const fail = (message: string) => {
    setProblem(message);
    return false;
  };

  const save = async (): Promise<boolean> => {
    setProblem("");
    if (!draft.name.trim()) return fail("A product name is required.");
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug)) return fail("The URL slug can only use lowercase letters, numbers and single dashes.");
    const badLink = imageProblem ?? photosProblem ?? offers.map(offerProblem).find(Boolean);
    if (badLink) return fail(badLink);
    if (draft.price_tracked && offers.some((o) => o.price <= 0))
      return fail('Every store offer needs a price above ₱0 — or turn off "Track prices" to list it as a "See prices" pick.');
    if (draft.published && offers.length === 0) return fail("Add at least one store offer before publishing.");

    const sb = adminDb();
    const row = {
      name: draft.name.trim(),
      slug: draft.slug,
      brand: draft.brand.trim(),
      category_id: draft.category_id,
      subcategory: draft.subcategory.trim(),
      emoji: draft.emoji.trim() || "🛍️",
      image: draft.image.trim(),
      images: draft.images.map((u) => u.trim()).filter(Boolean).slice(0, MAX_EXTRA_PHOTOS),
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
      // Only once the brands migration is in (the brand list loads); older databases have no brand_id column.
      ...(brands.data ? { brand_id: draft.brand_id ?? null } : {}),
    };

    const original = (o: OfferDraft) => Math.max(o.original_price, o.price);
    // "See prices" picks store no price, so nothing lands in the price history.
    const priced = (o: OfferDraft) =>
      draft.price_tracked ? { ...o, url: o.url.trim(), original_price: original(o) } : { ...o, url: o.url.trim(), price: 0, original_price: 0, shipping: 0 };

    setSaving(true);
    try {
      if (liveLocked && data) return await saveLive(row, priced);

      let id = params.id;
      if (isNew) {
        const { data: created, error } = await sb.from("products").insert(row).select("id").single();
        if (error) return fail(error.message);
        id = created.id;
      } else {
        const { error } = await sb.from("products").update(row).eq("id", id);
        if (error) return fail(error.message);
      }

      if (offers.length) {
        const { error } = await sb.from("offers").upsert(offers.map((o) => ({ ...priced(o), product_id: id })));
        if (error) return fail(`Product saved, but offers failed: ${error.message}`);
      }
      const keep = offers.map((o) => o.retailer_id);
      let del = sb.from("offers").delete().eq("product_id", id);
      if (keep.length) del = del.not("retailer_id", "in", `(${keep.join(",")})`);
      const { error: delError } = await del;
      if (delError) return fail(`Product saved, but removing old offers failed: ${delError.message}`);

      toast({ title: isNew ? "Product created" : "Product saved", body: draft.published ? "The shopper site picks it up within a minute." : undefined, kind: "ok" });
      if (isNew) router.replace(`/admin/products/${id}`);
      return true;
    } finally {
      setSaving(false);
    }
  };

  /** Editor on a live product: prices and stock go live now; other changes become a review request. */
  const saveLive = async (row: Record<string, unknown>, priced: (o: OfferDraft) => OfferDraft) => {
    if (!data) return false;
    const sb = adminDb();
    const { offers: liveOffers, ...live } = data;

    const product: { [k: string]: Json } = {};
    for (const k of CONTENT_KEYS) {
      if (!(k in row)) continue;
      const before = k === "rating" ? Number(live.rating) : live[k];
      if (JSON.stringify(row[k]) !== JSON.stringify(before)) product[k] = row[k] as Json;
    }
    const links: ChangeSet["offers"] = {};
    for (const o of offers) {
      const was = liveOffers.find((x) => x.retailer_id === o.retailer_id);
      if (was && was.url !== o.url.trim()) links[o.retailer_id] = { url: o.url.trim() };
    }
    const changes: ChangeSet = {
      ...(Object.keys(product).length ? { product } : {}),
      ...(Object.keys(links).length ? { offers: links } : {}),
    };

    if (draft.price_tracked !== live.price_tracked) {
      const { error } = await sb.from("products").update({ price_tracked: draft.price_tracked }).eq("id", live.id);
      if (error) return fail(error.message);
    }
    // Existing stores only, with their live links; link changes ride in the request.
    const kept = offers.flatMap((o) => {
      const was = liveOffers.find((x) => x.retailer_id === o.retailer_id);
      return was ? [{ ...priced(o), url: was.url, product_id: live.id }] : [];
    });
    if (kept.length) {
      const { error } = await sb.from("offers").upsert(kept);
      if (error) return fail(`Prices couldn't be saved: ${error.message}`);
    }

    const forReview = changeLabels(changes, storeName);
    if (forReview.length) {
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) return fail("Your session expired. Sign in again to send changes for review.");
      const { error } = await sb.from("product_change_requests").insert({ product_id: live.id, requested_by: auth.user.id, changes, note: note.trim().slice(0, 1000) });
      if (error) return fail(`Prices saved, but the review request failed: ${error.message}`);
      setNote("");
      toast({ title: "Sent for review", body: `An admin will check: ${forReview.join(", ")}. Prices and stock are live now.`, kind: "ok" });
    } else {
      toast({ title: "Prices saved", body: "The shopper site picks them up within a minute.", kind: "ok" });
    }
    reload();
    requests.reload();
    return true;
  };

  /** Editor on a draft: save it and put it in the admins' review queue. */
  const submitForReview = async () => {
    if (!(await save())) return;
    const sb = adminDb();
    const { data: auth } = await sb.auth.getUser();
    const { error } = await sb
      .from("products")
      .update({ review_requested_at: new Date().toISOString(), review_requested_by: auth.user?.id ?? null })
      .eq("id", params.id);
    if (error) return fail(error.message);
    toast({ title: "Submitted for review", body: "An admin will check it and publish it.", kind: "ok" });
    reload();
  };

  const remove = async () => {
    if (!window.confirm(`Delete “${draft.name}”? This also removes its offers, price history, saves and alerts.`)) return;
    const { error } = await adminDb().from("products").delete().eq("id", params.id);
    if (error) return fail(error.message);
    toast({ title: "Product deleted", kind: "ok" });
    router.push("/admin/products");
  };

  if (error) return <ErrorNote message={error} />;
  if (!isNew && loading && !data) return <Skeleton className="h-96" />;

  return (
    <div>
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1 text-sm text-ink/60 hover:text-pink">
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
        {!isNew && !canPublish && !liveLocked && (
          <button onClick={submitForReview} disabled={saving} className="btn-ghost">
            <Send className="h-4 w-4" /> {data?.review_requested_at ? "Resubmit for review" : "Submit for review"}
          </button>
        )}
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving…" : isNew ? "Create product" : liveLocked ? "Save" : "Save changes"}
        </button>
      </PageHeader>
      {problem && <p className="mb-4 rounded-2xl bg-coral/10 p-3 text-sm font-medium text-coral">{problem}</p>}
      <ReviewStatus canPublish={canPublish} pending={pending} latest={latest} submittedAt={data?.published ? null : data?.review_requested_at ?? null} />
      {liveLocked && (
        <Panel className="mb-6">
          <p className="text-sm text-ink/70">
            <b>This product is live.</b> Prices, stock and price tracking save straight away. Changes to anything else are sent to an admin for review
            first — shoppers keep seeing the current version until it&apos;s approved.
          </p>
          <Field label="Note for the reviewer (optional)" className="mt-3">
            <input className={adminInput} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Brand renamed its product, new photo from the official store" />
          </Field>
        </Panel>
      )}

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
              <Field label="Brand" hint={brands.data ? "Optional. Pick a brand page, type a name for an unlisted brand, or leave it empty" : "Optional"}>
                {brands.data && (
                  <select
                    className={cn(adminInput, "mb-2")}
                    value={draft.brand_id ?? ""}
                    onChange={(e) => {
                      const b = brands.data?.find((x) => x.id === e.target.value);
                      setDraft((d) => ({ ...d, brand_id: b?.id ?? null, brand: b?.name ?? d.brand }));
                    }}
                    aria-label="Brand page"
                  >
                    <option value="">No brand page</option>
                    {brands.data.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
                <input className={adminInput} value={draft.brand} onChange={(e) => set("brand", e.target.value)} aria-label="Brand name" placeholder="No brand" />
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
              unusedStores.length > 0 &&
              !liveLocked && (
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
              <p className="flex items-center gap-2 text-sm text-ink/50">
                <Plus className="h-4 w-4" /> Add the stores that sell this product.
              </p>
            ) : (
              <div className="space-y-3">
                {offers.map((o, i) => {
                  const update = (patch: Partial<OfferDraft>) => setOffers((all) => all.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                  return (
                    <div
                      key={o.retailer_id}
                      className={cn("grid gap-3 rounded-2xl border border-ink/15 p-3 sm:items-end", draft.price_tracked ? "sm:grid-cols-[150px_1fr_1fr_1fr_auto]" : "sm:grid-cols-[1fr_auto]")}
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
                        <span className="flex items-center gap-2 text-xs text-ink/60">
                          <Toggle on={o.in_stock} onChange={() => update({ in_stock: !o.in_stock })} label="In stock" /> In stock
                        </span>
                        {!liveLocked && (
                          <button onClick={() => setOffers((all) => all.filter((_, j) => j !== i))} className="text-ink/40 hover:text-coral" aria-label={`Remove ${o.retailer_id}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <Field
                        label="Product link at store"
                        hint="Paste the product's affiliate link here to earn on this exact product. Left empty, the store's affiliate link is used."
                        className={draft.price_tracked ? "sm:col-span-5" : "sm:col-span-2"}
                      >
                        <input
                          className={cn(adminInput, offerProblem(o) && "!border-coral")}
                          value={o.url}
                          onChange={(e) => update({ url: e.target.value })}
                          placeholder="https://…"
                          aria-invalid={!!offerProblem(o)}
                        />
                        <LinkNote error={offerProblem(o)} warning={storeLinkWarning(o.retailer_id, o.url)} />
                      </Field>
                    </div>
                  );
                })}
                {liveLocked && <p className="text-[11px] text-ink/50">Adding or removing a store on a live product is done by an admin.</p>}
                <p className="text-[11px] text-ink/40">
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
                <p className="rounded-2xl bg-lavender p-3 text-xs text-ink/70">
                  {draft.published
                    ? "Live on the shopper site. Price and stock edits show up within a minute; other edits after an admin approves them."
                    : "Draft: when it's ready, tap Submit for review and an admin will publish it."}
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
                  className={cn(adminInput, imageProblem && "!border-coral")}
                  aria-invalid={!!imageProblem}
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
            <LinkNote
              error={imageProblem}
              warning={draft.image && imageFailed ? "This image link doesn't load. Use a direct link to a .jpg, .png or .webp image." : null}
            />
            <p className="mt-2 text-[11px] text-ink/40">If the image can&apos;t load, shoppers see the emoji tile.</p>
            <hr className="my-5 border-ink/10" />
            <PhotoSlides cover={draft.image} photos={draft.images} onChange={(images) => set("images", images)} />
          </Panel>

          <Panel title="Vibes" action={<span className="text-xs text-ink/50">Swipe filters</span>}>
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
              <p className="text-sm text-ink/70">
                Lowest price <b>{peso(Math.min(...offers.map((o) => o.price)))}</b> across {offers.length} store{offers.length > 1 ? "s" : ""}.
              </p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkNote({ error, warning }: { error: string | null; warning: string | null }) {
  if (!error && !warning) return null;
  return (
    <span className={cn("mt-1 flex items-start gap-1 text-[11px] font-medium", error ? "text-coral" : "text-amber-700")} role={error ? "alert" : undefined}>
      <AlertTriangle className="mt-px h-3 w-3 shrink-0" /> {error ?? warning}
    </span>
  );
}

/** Where this product stands in the review queue. */
function ReviewStatus({ canPublish, pending, latest, submittedAt }: { canPublish: boolean; pending: RequestRow[]; latest?: RequestRow; submittedAt: string | null }) {
  const box = "mb-4 flex items-start gap-2 rounded-2xl p-3 text-sm";
  if (canPublish) {
    if (!pending.length && !submittedAt) return null;
    return (
      <p className={cn(box, "bg-lavender text-ink/80")}>
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-pink" />
        <span>
          {submittedAt ? `An editor submitted this draft for review (${shortDate(submittedAt)}). ` : ""}
          {pending.length > 0 && `${pending.length} change request${pending.length > 1 ? "s" : ""} waiting. `}
          <Link href="/admin/review" className="font-semibold text-pink underline">
            Open the review queue
          </Link>
        </span>
      </p>
    );
  }
  if (pending.length) {
    return (
      <p className={cn(box, "bg-lavender text-ink/80")}>
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-pink" />
        <span>
          <b>Waiting for review:</b> {pending.flatMap((r) => changeLabels(asChangeSet(r.changes), storeName)).join(", ")} · sent {shortDate(pending[0].created_at)}
        </span>
      </p>
    );
  }
  if (latest?.status === "rejected") {
    return (
      <p className={cn(box, "bg-coral/10 text-coral")}>
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <b>Changes sent back</b>
          {latest.reviewed_at ? ` (${shortDate(latest.reviewed_at)})` : ""}: {latest.review_note ? `“${latest.review_note}”` : "no note"}. Edit and save to send them again.
        </span>
      </p>
    );
  }
  if (submittedAt) {
    return (
      <p className={cn(box, "bg-lavender text-ink/80")}>
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-pink" />
        <span>
          <b>Submitted for review</b> {shortDate(submittedAt)}. An admin will publish it.
        </span>
      </p>
    );
  }
  return null;
}
