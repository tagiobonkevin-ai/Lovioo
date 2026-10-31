"use client";

import { Bookmark, Eye, Globe, Heart, MousePointerClick, SkipForward, Sparkles, UserPlus } from "lucide-react";
import { useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel } from "@/components/admin/ui";
import { retailerById } from "@/lib/data/retailers";
import { compact } from "@/lib/utils";

export interface PartnerStats {
  products: { total: number; live: number; in_review: number; drafts: number };
  views: number;
  click_outs: number;
  clicks_by_store: { retailer_id: string; n: number }[];
  swipes: { love: number; super: number; nope: number };
  saves: number;
  referral_visits: number;
  referral_signups: number;
  daily: { day: string; views: number; clicks: number; loves: number }[];
  per_product: { id: string; slug: string; name: string; image: string; emoji: string; published: boolean; views: number; clicks: number; loves: number; super_loves: number; nexts: number; saves: number }[];
}

/** The numbers a Brand Partner sees (also shown to admins on Admin -> Brand Partners). */
export function PartnerStatsView({ stats: s }: { stats: PartnerStats }) {
  const daily = useMemo(
    () =>
      s.daily.map((d) => ({
        label: new Date(d.day + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
        Views: Number(d.views),
        "Store clicks": Number(d.clicks),
        Loves: Number(d.loves),
      })),
    [s.daily],
  );
  const n = (v: number) => Number(v);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Tile icon={Eye} label="Product views" value={n(s.views)} sub="Shoppers opened your products" />
        <Tile icon={MousePointerClick} label="Store clicks" value={n(s.click_outs)} sub={n(s.views) ? `${Math.round((n(s.click_outs) / n(s.views)) * 100)}% of views` : "Taps through to buy"} />
        <Tile icon={Heart} label="Loves" value={n(s.swipes.love)} sub="Swiped right" />
        <Tile icon={Sparkles} label="Super loves" value={n(s.swipes.super)} sub="Swiped up" />
        <Tile icon={SkipForward} label="Next" value={n(s.swipes.nope)} sub="Swiped left" />
        <Tile icon={Bookmark} label="Wishlist adds" value={n(s.saves)} sub="Saved for later" />
        <Tile icon={Globe} label="Visits from your site" value={n(s.referral_visits)} sub="Via your Lovioo links" />
        <Tile icon={UserPlus} label="Sign-ups from your site" value={n(s.referral_signups)} sub="New Lovioo members" />
      </div>

      <Panel title="Day by day">
        {daily.length ? (
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Views" stroke="#111111" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="Store clicks" stroke="#FF8A5B" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="Loves" stroke="#FF4FB8" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-ink/45">Nothing counted in this period yet.</p>
        )}
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Your products">
          <p className="-mt-1 mb-3 text-xs text-ink/50">
            {n(s.products.live)} live · {n(s.products.in_review)} in review · {n(s.products.drafts)} drafts
          </p>
          {s.per_product.length ? (
            <div className="-mx-1 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-[10px] font-bold uppercase tracking-wider text-ink/45">
                  <tr>
                    <th className="px-1 pb-2">Product</th>
                    <th className="px-1 pb-2 text-right">Views</th>
                    <th className="px-1 pb-2 text-right">Clicks</th>
                    <th className="px-1 pb-2 text-right">Loves</th>
                    <th className="px-1 pb-2 text-right">Super</th>
                    <th className="px-1 pb-2 text-right">Next</th>
                    <th className="px-1 pb-2 text-right">Saves</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {s.per_product.map((p) => (
                    <tr key={p.id}>
                      <td className="max-w-[220px] px-1 py-2">
                        <span className="block truncate font-semibold">{p.name}</span>
                        <span className={p.published ? "text-[11px] text-emerald-600" : "text-[11px] text-ink/45"}>{p.published ? "Live" : "Not live yet"}</span>
                      </td>
                      {[p.views, p.clicks, p.loves, p.super_loves, p.nexts, p.saves].map((v, i) => (
                        <td key={i} className="px-1 py-2 text-right tabular-nums">
                          {compact(n(v))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-ink/45">No products yet.</p>
          )}
        </Panel>
        <Panel title="Store clicks by store">
          {s.clicks_by_store.length ? (
            <ul className="space-y-2.5">
              {s.clicks_by_store.map((c) => {
                const max = Math.max(1, ...s.clicks_by_store.map((x) => n(x.n)));
                return (
                  <li key={c.retailer_id}>
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">{c.retailer_id === "unknown" ? "Other" : retailerById(c.retailer_id as never).name}</span>
                      <span className="text-ink/55">{n(c.n)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/5">
                      <div className="h-full rounded-full bg-pink" style={{ width: `${(n(c.n) / max) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-ink/45">No store clicks yet.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number; sub: string }) {
  return (
    <div className="min-w-0 rounded-3xl bg-white p-4 shadow-soft sm:p-5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink/50">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-pink/10 text-pink">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-3 text-[24px] leading-[1.45] sm:text-3xl">{compact(value)}</p>
      <p className="mt-0.5 truncate text-xs text-ink/50">{sub}</p>
    </div>
  );
}
