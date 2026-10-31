"use client";

import { Eye, Heart, MessageCircle, MousePointerClick, RefreshCw, Search, SkipForward, Sparkles, Trash2, Bookmark } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminDb, saveWith, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Panel, Skeleton } from "@/components/admin/ui";
import { AI_LANGS } from "@/lib/ai-i18n";
import { retailerById } from "@/lib/data/retailers";
import { cn, compact } from "@/lib/utils";

interface Pick {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  emoji: string;
  n: number;
}
interface Insights {
  swipes: { love: number; super: number; nope: number };
  swipes_daily: { day: string; love: number; super: number; nope: number }[];
  top_loved: Pick[];
  top_super: Pick[];
  top_nope: Pick[];
  saves: number;
  views: number;
  click_outs: number;
  clicks_by_store: { retailer_id: string; n: number }[];
  searches: number;
  top_searches: { query: string; n: number; avg_results: number }[];
  empty_searches: { query: string; n: number }[];
  recent_searches: { query: string; results: number; created_at: string; shopper: string | null; email: string | null }[];
  ai_questions: number;
  ai_by_lang: { lang: string; n: number }[];
  ai_no_match: { question: string; n: number }[];
  recent_ai: { question: string; lang: string; results: number; source: string; created_at: string; shopper: string | null; email: string | null }[];
}

const RANGES = [7, 30, 90];
const langLabel = (id: string) => AI_LANGS.find((l) => l.id === id)?.label ?? id;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const when = (iso: string) => new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Admin -> Shopper Insights: swipes (love, super love, next), searches, Lovioo AI questions, views and store clicks. */
export default function AdminInsights() {
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<"searches" | "ai">("searches");
  const { data, error, loading, reload } = useAdminQuery(
    async (sb) => {
      const res = await sb.rpc("admin_insights", { days });
      return { data: res.data as unknown as Insights | null, error: res.error };
    },
    [days],
  );

  const daily = useMemo(
    () =>
      (data?.swipes_daily ?? []).map((d) => ({
        label: new Date(d.day + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
        Love: Number(d.love),
        "Super love": Number(d.super),
        Next: Number(d.nope),
      })),
    [data],
  );

  const purge = async () => {
    if (!window.confirm("Delete searches and Lovioo AI questions older than 12 months? This can't be undone.")) return;
    const res = await adminDb().rpc("purge_old_activity", { months: 12 });
    if (await saveWith(Promise.resolve({ error: res.error }), `Deleted ${res.data ?? 0} old activity rows`)) reload();
  };

  return (
    <div>
      <PageHeader title="Shopper Insights" sub="What shoppers love, skip, search for and ask Lovioo AI. Names show only for shoppers who allowed analytics.">
        <div className="flex rounded-full bg-white p-1 shadow-sm">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setDays(r)} className={cn("rounded-full px-3.5 py-1.5 text-xs font-semibold", days === r ? "bg-pink text-white" : "text-ink/60")}>
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
            <Stat icon={Heart} label="Loves" value={data.swipes.love} sub="Swiped right" />
            <Stat icon={Sparkles} label="Super loves" value={data.swipes.super} sub="Swiped up" />
            <Stat icon={SkipForward} label="Next" value={data.swipes.nope} sub="Swiped left (nope)" />
            <Stat icon={Bookmark} label="Wishlist adds" value={data.saves} sub="Saved products" />
            <Stat icon={Eye} label="Product views" value={data.views} sub="Product pages opened" />
            <Stat
              icon={MousePointerClick}
              label="Store clicks"
              value={data.click_outs}
              sub={data.views ? `${Math.round((data.click_outs / data.views) * 100)}% of views` : "To Shopee, Lazada…"}
            />
            <Stat icon={Search} label="Searches" value={data.searches} sub={`${data.empty_searches.reduce((n, s) => n + Number(s.n), 0)} found nothing`} />
            <Stat icon={MessageCircle} label="AI questions" value={data.ai_questions} sub={data.ai_by_lang.map((l) => `${langLabel(l.lang)} ${l.n}`).join(" · ") || "Lovioo AI"} />
          </div>

          <Panel title="Swipes per day">
            {daily.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Love" stackId="s" fill="#FF4FB8" isAnimationActive={false} />
                    <Bar dataKey="Super love" stackId="s" fill="#FF8A5B" isAnimationActive={false} />
                    <Bar dataKey="Next" stackId="s" fill="#C9C9D1" isAnimationActive={false} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty>No swipes in this period yet.</Empty>
            )}
          </Panel>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-3">
            <ProductList title="Most loved" items={data.top_loved} empty="No loves yet." />
            <ProductList title="Most super-loved" items={data.top_super} empty="No super loves yet." />
            <ProductList title="Most skipped (Next)" items={data.top_nope} empty="Nothing skipped yet." />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
            <Panel title="Top searches">
              <RankList rows={data.top_searches.map((s) => ({ label: s.query, n: Number(s.n), note: `${plural(Number(s.avg_results), "result", "results")} avg` }))} empty="No searches yet." />
            </Panel>
            <Panel title="Searches that found nothing">
              <p className="-mt-1 mb-3 text-xs text-ink/50">Products shoppers want that Lovioo doesn&apos;t have yet.</p>
              <RankList rows={data.empty_searches.map((s) => ({ label: s.query, n: Number(s.n) }))} empty="Every search found something." />
            </Panel>
            <Panel title="Lovioo AI questions with no match">
              <RankList rows={data.ai_no_match.map((s) => ({ label: s.question, n: Number(s.n) }))} empty="Every question found products." />
            </Panel>
            <Panel title="Store clicks by store">
              <RankList rows={data.clicks_by_store.map((c) => ({ label: c.retailer_id === "unknown" ? "Unknown" : retailerById(c.retailer_id as never)?.name ?? c.retailer_id, n: Number(c.n) }))} empty="No store clicks yet." />
            </Panel>
          </div>

          <Panel
            title="Latest activity"
            action={
              <div className="flex rounded-full bg-ink/[0.04] p-1">
                {(["searches", "ai"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={cn("rounded-full px-3 py-1 text-xs font-semibold", tab === t ? "bg-white text-pink shadow-sm" : "text-ink/60")}>
                    {t === "searches" ? "Searches" : "AI questions"}
                  </button>
                ))}
              </div>
            }
          >
            <ul className="divide-y divide-ink/5">
              {(tab === "searches"
                ? data.recent_searches.map((r) => ({ text: r.query, meta: plural(r.results, "result", "results"), at: r.created_at, who: r.shopper || r.email }))
                : data.recent_ai.map((r) => ({ text: r.question, meta: `${langLabel(r.lang)} · ${plural(r.results, "product", "products")} · ${r.source === "home" ? "home page" : "app"}`, at: r.created_at, who: r.shopper || r.email }))
              ).map((r, i) => (
                <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5">
                  <span className="min-w-0 flex-1 break-words text-sm font-semibold">{r.text}</span>
                  <span className="text-[11px] text-ink/50">
                    {r.meta} · {r.who ? <span className="font-semibold text-ink/70">{r.who}</span> : "anonymous"} · {when(r.at)}
                  </span>
                </li>
              ))}
            </ul>
            {(tab === "searches" ? data.recent_searches : data.recent_ai).length === 0 && <Empty>Nothing yet in this period.</Empty>}
          </Panel>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-4 text-xs text-ink/55 shadow-soft">
            <p className="max-w-[60ch]">
              Searches and AI questions are kept for 12 months (see the Privacy Policy). They&apos;re linked to a shopper only when that shopper allowed
              analytics; brand partners never see them.
            </p>
            <button onClick={purge} className="btn-ghost !px-3 !py-1.5 text-xs text-coral">
              <Trash2 className="h-3.5 w-3.5" /> Delete activity older than 12 months
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number; sub: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-soft sm:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink/50">
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-pink/10 text-pink">
          <Icon className="h-3.5 w-3.5" />
        </span>
        {label}
      </div>
      <p className="mt-3 text-[24px] leading-[1.45] sm:text-3xl">{compact(Number(value))}</p>
      <p className="mt-0.5 truncate text-xs text-ink/50">{sub}</p>
    </div>
  );
}

function ProductList({ title, items, empty }: { title: string; items: Pick[]; empty: string }) {
  return (
    <Panel title={title}>
      {items.length ? (
        <ol className="space-y-2.5">
          {items.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3">
              <span className="w-4 text-xs font-bold text-ink/35">{i + 1}</span>
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-pink-soft text-lg">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span aria-hidden>{p.emoji}</span>
                )}
              </span>
              <Link href={`/admin/products/${p.id}`} className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold hover:text-pink">{p.name}</span>
                <span className="text-[11px] text-ink/50">{p.brand}</span>
              </Link>
              <span className="text-sm font-bold">{compact(Number(p.n))}</span>
            </li>
          ))}
        </ol>
      ) : (
        <Empty>{empty}</Empty>
      )}
    </Panel>
  );
}

function RankList({ rows, empty }: { rows: { label: string; n: number; note?: string }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold">{r.label}</span>
            <span className="shrink-0 text-xs text-ink/55">
              {r.n}
              {r.note ? ` · ${r.note}` : ""}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/5">
            <div className="h-full rounded-full bg-pink" style={{ width: `${(r.n / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-ink/45">{children}</p>;
}
