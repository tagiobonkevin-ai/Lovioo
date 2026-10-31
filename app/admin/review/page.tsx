"use client";

import { Check, ExternalLink, Pencil, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { adminDb, saveWith, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Panel, Skeleton, adminInput } from "@/components/admin/ui";
import { CATEGORIES } from "@/lib/data/categories";
import { retailerById } from "@/lib/data/retailers";
import { CONTENT_FIELDS, asChangeSet, changeLabels, shortDate, type ContentField } from "@/lib/review";
import type { Json } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

const storeName = (id: string) => retailerById(id).name;

/** Admins: publish drafts editors submitted, and approve or send back editors' changes to live products. */
export default function ReviewQueue() {
  const drafts = useAdminQuery((sb) =>
    sb
      .from("products")
      .select("id, slug, name, brand, emoji, image, review_requested_at, review_requested_by, offers(retailer_id)")
      .eq("published", false)
      .not("review_requested_at", "is", null)
      .order("review_requested_at"),
  );
  const changes = useAdminQuery((sb) =>
    sb
      .from("product_change_requests")
      .select(
        "*, products(id, slug, name, brand, brand_id, category_id, subcategory, emoji, image, tags, vibes, description, highlights, is_new, trending, rating, review_count, offers(retailer_id, url))",
      )
      .eq("status", "pending")
      .order("created_at"),
  );
  const recent = useAdminQuery((sb) =>
    sb
      .from("product_change_requests")
      .select("id, status, changes, requested_by_email, reviewed_by_email, review_note, reviewed_at, products(name)")
      .neq("status", "pending")
      .order("reviewed_at", { ascending: false })
      .limit(8),
  );
  const team = useAdminQuery((sb) => sb.rpc("list_team"));
  const who = (id: string | null) => team.data?.find((u) => u.id === id)?.email ?? "an editor";
  // Brand Partner submissions are labelled so they get a closer look (claims, prices and links).
  const partners = useAdminQuery((sb) => sb.from("brand_members").select("user_id, brand_id"));
  const partnerOf = (id: string | null) => partners.data?.find((m) => m.user_id === id)?.brand_id;
  const PartnerTag = ({ id }: { id: string | null }) =>
    partnerOf(id) ? <span className="ml-1 rounded-full bg-pink/10 px-2 py-0.5 text-[10px] font-bold text-pink">Brand Partner</span> : null;

  const [notes, setNotes] = useState<Record<number, string>>({});
  const [sendingBack, setSendingBack] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = () => {
    drafts.reload();
    changes.reload();
    recent.reload();
  };
  const run = async (key: string, p: PromiseLike<{ error: { message: string } | null }>, ok: string) => {
    setBusy(key);
    const done = await saveWith(p, ok);
    setBusy(null);
    if (done) refresh();
    return done;
  };

  const publish = (id: string, name: string) => run(`p:${id}`, adminDb().from("products").update({ published: true }).eq("id", id), `${name} is live`);
  const approve = (id: number) => run(`a:${id}`, adminDb().rpc("approve_product_change", { request_id: id }), "Changes approved and live");
  const sendBack = async (id: number) => {
    if (
      await run(
        `r:${id}`,
        adminDb().rpc("reject_product_change", {
          request_id: id,
          note: (notes[id] ?? "").trim(),
        }),
        "Sent back to the editor",
      )
    )
      setSendingBack(null);
  };

  const error = drafts.error ?? changes.error;
  const total = (drafts.data?.length ?? 0) + (changes.data?.length ?? 0);

  return (
    <div>
      <PageHeader
        title="Review queue"
        sub="Editors' drafts waiting to go live, and their changes to live products. Nothing here reaches shoppers until you approve it."
      />
      {error && <ErrorNote message={error} />}
      {(drafts.loading || changes.loading) && !drafts.data && !changes.data && <Skeleton className="h-64" />}

      {drafts.data && changes.data && (
        <div className="space-y-8">
          {total === 0 && (
            <Panel>
              <p className="py-6 text-center text-sm text-ink/60">🎉 All caught up — nothing waiting for review.</p>
            </Panel>
          )}

          {drafts.data.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink/50">Drafts ready to publish · {drafts.data.length}</h2>
              <ul className="space-y-3">
                {drafts.data.map((p) => (
                  <li key={p.id}>
                    <Panel className="flex flex-wrap items-center gap-3">
                      <Thumb image={p.image} emoji={p.emoji} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{p.name}</p>
                        <p className="text-xs text-ink/50">
                          {p.brand} · {p.offers.length} store
                          {p.offers.length === 1 ? "" : "s"} · submitted by {who(p.review_requested_by)} <PartnerTag id={p.review_requested_by} />
                          {p.review_requested_at ? ` · ${shortDate(p.review_requested_at)}` : ""}
                        </p>
                        {p.offers.length === 0 && <p className="mt-1 text-xs font-medium text-coral">Needs at least one store before it can go live.</p>}
                      </div>
                      <Link href={`/admin/products/${p.id}`} className="btn-ghost !py-2">
                        <Pencil className="h-4 w-4" /> Open
                      </Link>
                      <button onClick={() => publish(p.id, p.name)} disabled={busy !== null || p.offers.length === 0} className="btn-primary !py-2">
                        <Check className="h-4 w-4" /> {busy === `p:${p.id}` ? "Publishing…" : "Publish"}
                      </button>
                    </Panel>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {changes.data.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink/50">Changes to live products · {changes.data.length}</h2>
              <ul className="space-y-4">
                {changes.data.map((r) => {
                  const c = asChangeSet(r.changes);
                  const p = r.products;
                  return (
                    <li key={r.id}>
                      <Panel>
                        <div className="flex flex-wrap items-start gap-3">
                          <Thumb image={p?.image ?? ""} emoji={p?.emoji ?? "🛍️"} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold">{p?.name ?? r.product_id}</p>
                            <p className="text-xs text-ink/50">
                              {r.requested_by_email ?? "An editor"} <PartnerTag id={r.requested_by} /> · {shortDate(r.created_at)} · {changeLabels(c, storeName).join(", ")}
                            </p>
                            {r.note && <p className="mt-2 rounded-xl bg-lavender px-3 py-2 text-xs text-ink/80">“{r.note}”</p>}
                          </div>
                          {p && (
                            <Link href={`/product/${p.slug}`} target="_blank" className="btn-ghost !py-2 text-xs">
                              Live page <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </div>

                        <dl className="mt-4 divide-y divide-ink/10/70 rounded-2xl border border-ink/15">
                          {Object.entries(c.product ?? {}).map(([k, after]) => (
                            <Diff
                              key={k}
                              label={CONTENT_FIELDS[k as ContentField] ?? k}
                              field={k}
                              before={(p as Record<string, Json> | null)?.[k] ?? null}
                              after={after}
                            />
                          ))}
                          {Object.entries(c.offers ?? {}).map(([rid, o]) => (
                            <Diff
                              key={rid}
                              label={`${storeName(rid)} link`}
                              field="url"
                              before={p?.offers.find((x) => x.retailer_id === rid)?.url ?? ""}
                              after={o.url}
                            />
                          ))}
                        </dl>

                        {sendingBack === r.id ? (
                          <div className="mt-4 space-y-2">
                            <textarea
                              className={adminInput}
                              rows={2}
                              maxLength={1000}
                              autoFocus
                              value={notes[r.id] ?? ""}
                              onChange={(e) =>
                                setNotes((n) => ({
                                  ...n,
                                  [r.id]: e.target.value,
                                }))
                              }
                              placeholder="What should the editor fix? They'll see this note on the product."
                              aria-label="Note for the editor"
                            />
                            <div className="flex flex-wrap justify-end gap-2">
                              <button onClick={() => setSendingBack(null)} className="btn-ghost !py-2">
                                Cancel
                              </button>
                              <button onClick={() => sendBack(r.id)} disabled={busy !== null} className="btn border border-coral/30 bg-white !py-2 text-coral">
                                <Undo2 className="h-4 w-4" /> {busy === `r:${r.id}` ? "Sending…" : "Send back"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 flex flex-wrap justify-end gap-2">
                            <button onClick={() => setSendingBack(r.id)} disabled={busy !== null} className="btn-ghost !py-2">
                              <Undo2 className="h-4 w-4" /> Send back…
                            </button>
                            <button onClick={() => approve(r.id)} disabled={busy !== null} className="btn-primary !py-2">
                              <Check className="h-4 w-4" /> {busy === `a:${r.id}` ? "Approving…" : "Approve"}
                            </button>
                          </div>
                        )}
                      </Panel>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {recent.data && recent.data.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink/50">Recently reviewed</h2>
              <Panel>
                <ul className="divide-y divide-ink/10/70 text-sm">
                  {recent.data.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-bold",
                          r.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-coral/10 text-coral",
                        )}
                      >
                        {r.status === "approved" ? "Approved" : "Sent back"}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        <b>{r.products?.name ?? "Deleted product"}</b> · {changeLabels(asChangeSet(r.changes), storeName).join(", ")}
                        {r.review_note ? ` · “${r.review_note}”` : ""}
                      </span>
                      <span className="text-xs text-ink/50">
                        {r.requested_by_email ?? "editor"} → {r.reviewed_by_email ?? "admin"}
                        {r.reviewed_at ? ` · ${shortDate(r.reviewed_at)}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function Thumb({ image, emoji }: { image: string; emoji: string }) {
  return (
    <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-blush text-2xl">
      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : emoji}
    </span>
  );
}

const show = (field: string, v: Json): string => {
  if (v === null || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(field === "highlights" ? " · " : ", ") : "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (field === "category_id") return CATEGORIES.find((c) => c.id === v)?.name ?? String(v);
  return String(v);
};

/** One changed field, before → after. Images are shown side by side. */
function Diff({ label, field, before, after }: { label: string; field: string; before: Json; after: Json }) {
  const isImage = field === "image";
  return (
    <div className="grid gap-2 p-3 text-sm sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,1fr)]">
      <dt className="text-xs font-semibold uppercase tracking-wider text-ink/50">{label}</dt>
      {(["Now", "Proposed"] as const).map((tag, i) => {
        const v = i === 0 ? before : after;
        return (
          <dd key={tag} className={cn("min-w-0 rounded-xl px-3 py-2", i === 0 ? "bg-midnight/[0.04] text-ink/60" : "bg-pink/5 text-ink")}>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink/40">{tag}</span>
            {isImage && typeof v === "string" && v ? (
              <img src={v} alt="" className="aspect-square w-full max-w-[160px] rounded-lg bg-blush object-cover" />
            ) : (
              <span className="block whitespace-pre-wrap break-words">{show(field, v)}</span>
            )}
            {(isImage || field === "url") && typeof v === "string" && v && <span className="mt-1 block truncate text-[11px] text-ink/40">{v}</span>}
          </dd>
        );
      })}
    </div>
  );
}
