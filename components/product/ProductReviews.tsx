"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/components/Providers";
import { useLovioo } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

export type Review = Database["public"]["Tables"]["product_reviews"]["Row"];

export interface ReviewsState {
  reviews: Review[];
  loading: boolean;
  average: number;
  count: number;
  reload: () => void;
}

/** Reviews written by Lovioo members for one product (members-only, like the catalogue). */
export function useProductReviews(productId: string): ReviewsState {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return setLoading(false);
    const { data } = await sb.from("product_reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false }).limit(200);
    setReviews(data ?? []);
    setLoading(false);
  }, [productId]);
  useEffect(() => {
    load();
  }, [load]);
  const shown = reviews.filter((r) => !r.hidden);
  const average = shown.length ? shown.reduce((n, r) => n + r.rating, 0) / shown.length : 0;
  return { reviews, loading, average, count: shown.length, reload: load };
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("flex", className)} aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-4 w-4", i < Math.round(value) ? "fill-sunset text-sunset" : "text-ink/15")} aria-hidden />
      ))}
    </span>
  );
}

/** The "Reviews" section of a product page: summary, the latest reviews and the member's own review form. */
export function ProductReviews({ productId, state }: { productId: string; state: ReviewsState }) {
  const user = useLovioo((s) => s.user);
  const { reviews, loading, average, count, reload } = state;
  const mine = reviews.find((r) => r.user_id === user?.id);
  const others = reviews.filter((r) => !r.hidden && r.user_id !== user?.id);
  const bars = useMemo(() => [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => !r.hidden && r.rating === s).length })), [reviews]);

  return (
    <section id="reviews" className="scroll-mt-20 rounded-[2rem] bg-white p-5 shadow-[0_24px_60px_-38px_rgba(17,17,17,0.35)] ring-1 ring-ink/[0.06] sm:p-6">
      <h2 className="text-[20px] leading-[1.5]">Reviews</h2>
      <p className="text-xs text-ink/50">Written by Lovioo members. Store ratings are shown at the top of the page.</p>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div>
          {count > 0 ? (
            <>
              <p className="flex items-end gap-2">
                <span className="text-[36px] font-extrabold leading-none">{average.toFixed(1)}</span>
                <span className="pb-1 text-sm text-ink/55">
                  out of 5 · {count} {count === 1 ? "review" : "reviews"}
                </span>
              </p>
              <Stars value={average} className="mt-1" />
              <ul className="mt-3 space-y-1">
                {bars.map(({ s, n }) => (
                  <li key={s} className="flex items-center gap-2 text-xs text-ink/60">
                    <span className="w-3">{s}</span>
                    <Star className="h-3 w-3 fill-sunset text-sunset" aria-hidden />
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/5">
                      <span className="block h-full rounded-full bg-sunset" style={{ width: `${count ? (n / count) * 100 : 0}%` }} />
                    </span>
                    <span className="w-6 text-right">{n}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ink/55">{loading ? "Loading reviews…" : "No Lovioo reviews yet. Tried it? Be the first to share."}</p>
          )}
          <div className="mt-5">
            {user ? (
              <ReviewForm productId={productId} mine={mine} onDone={reload} />
            ) : (
              <Link href="/auth?mode=signin" className="btn-primary !py-2 text-sm">
                Sign in to write a review
              </Link>
            )}
          </div>
        </div>

        <ul className="divide-y divide-ink/5">
          {others.map((r) => (
            <li key={r.id} className="py-4 first:pt-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars value={r.rating} />
                <span className="text-sm font-semibold">{r.reviewer_name || "Lovioo shopper"}</span>
                <span className="text-xs text-ink/45">{new Date(r.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
              {r.body && <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink/75 [overflow-wrap:anywhere]">{r.body}</p>}
            </li>
          ))}
          {!loading && others.length === 0 && count > 0 && <li className="py-4 text-sm text-ink/50">Yours is the only review so far.</li>}
        </ul>
      </div>
    </section>
  );
}

function ReviewForm({ productId, mine, onDone }: { productId: string; mine?: Review; onDone: () => void }) {
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [body, setBody] = useState(mine?.body ?? "");
  const [editing, setEditing] = useState(!mine);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRating(mine?.rating ?? 0);
    setBody(mine?.body ?? "");
    setEditing(!mine);
  }, [mine]);

  const save = async () => {
    const sb = getSupabase();
    if (!sb) return;
    if (rating < 1) return toast({ title: "Tap the stars to rate it", kind: "error" });
    setBusy(true);
    const text = body.trim().slice(0, 1000);
    const { error } = mine
      ? await sb.from("product_reviews").update({ rating, body: text }).eq("id", mine.id)
      : await sb.from("product_reviews").insert({ product_id: productId, rating, body: text });
    setBusy(false);
    if (error) return toast({ title: "Couldn't save your review", body: error.message, kind: "error" });
    toast({ title: mine ? "Review updated" : "Thanks for your review! 💗", kind: "ok" });
    onDone();
  };

  const remove = async () => {
    const sb = getSupabase();
    if (!sb || !mine || !window.confirm("Delete your review?")) return;
    setBusy(true);
    const { error } = await sb.from("product_reviews").delete().eq("id", mine.id);
    setBusy(false);
    if (error) return toast({ title: "Couldn't delete it", body: error.message, kind: "error" });
    toast({ title: "Review deleted", kind: "ok" });
    onDone();
  };

  if (mine && !editing)
    return (
      <div className="rounded-2xl bg-pink-soft/60 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-pink">Your review</p>
        <Stars value={mine.rating} className="mt-1" />
        {mine.body && <p className="mt-1 whitespace-pre-line text-sm text-ink/75 [overflow-wrap:anywhere]">{mine.body}</p>}
        {mine.hidden && <p className="mt-1 text-xs text-coral">Hidden by Lovioo: only you can see it.</p>}
        <div className="mt-2 flex gap-3 text-sm font-semibold">
          <button onClick={() => setEditing(true)} className="text-pink">
            Edit
          </button>
          <button onClick={remove} disabled={busy} className="text-ink/50">
            Delete
          </button>
        </div>
      </div>
    );

  return (
    <div className="rounded-2xl bg-pink-soft/60 p-4">
      <p className="text-sm font-bold">{mine ? "Edit your review" : "Write a review"}</p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="p-0.5">
            <Star className={cn("h-7 w-7 transition", n <= rating ? "fill-sunset text-sunset" : "text-ink/20")} />
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1000}
        placeholder="What did you like? How's the shade, size or quality?"
        className="mt-2 min-h-[90px] w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-[16px] outline-none focus:border-pink sm:text-sm"
        aria-label="Your review"
      />
      <p className="mt-1 text-[11px] text-ink/45">Shown to members with your first name and last initial.</p>
      <div className="mt-2 flex gap-2">
        <button onClick={save} disabled={busy} className="btn-primary !py-2 text-sm">
          {busy ? "Saving…" : mine ? "Save changes" : "Post review"}
        </button>
        {mine && (
          <button onClick={() => setEditing(false)} className="btn-ghost !py-2 text-sm">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
