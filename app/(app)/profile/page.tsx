"use client";

import { BarChart3, Bell, ChevronRight, HelpCircle, LogOut, Shield, ShoppingBag, Sparkles, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { useHydrated } from "@/components/Providers";
import { BUDGETS, CATEGORIES } from "@/lib/data/categories";
import { ALL_RETAILERS, retailerById } from "@/lib/data/retailers";
import { useLovioo } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import type { CategoryId, RetailerId } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { user, prefs, saved, alerts, swipes, streak, setPrefs, signOut } = useLovioo();
  const [notify, setNotify] = useState({ drops: true, restock: true, digest: false });
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !user?.id) return;
    sb.rpc("current_app_role").then(({ data }) => setIsStaff(!!data && data !== "customer"));
  }, [user?.id]);

  if (!hydrated) return <div className="h-64 animate-pulse rounded-3xl bg-white/60" />;
  if (!user) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <span className="text-5xl">👋</span>
        <h1 className="mt-3 text-xl font-bold">Sign in to see your profile</h1>
        <p className="mt-1 text-sm text-midnight/60">Keep your loves, alerts and preferences in one place.</p>
        <Link href="/auth?next=/profile" className="btn-primary mt-5">
          Sign in
        </Link>
      </div>
    );
  }

  const toggleInterest = (c: CategoryId) =>
    setPrefs({ interests: prefs.interests.includes(c) ? prefs.interests.filter((x) => x !== c) : [...prefs.interests, c] });
  const togglePlatform = (r: RetailerId) =>
    setPrefs({ platforms: prefs.platforms.includes(r) ? prefs.platforms.filter((x) => x !== r) : [...prefs.platforms, r] });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="card flex flex-wrap items-center gap-5 overflow-hidden p-6">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-brand text-3xl font-extrabold text-white shadow-pop">{user.name[0]?.toUpperCase()}</span>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">{user.name}</h1>
          <p className="text-sm text-midnight/60">{user.email}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            ["Loves", saved.length],
            ["Alerts", alerts.length],
            ["Swipes", swipes.length],
          ].map(([l, v]) => (
            <div key={l} className="rounded-2xl bg-blush px-4 py-2">
              <p className="text-xl font-extrabold text-pink">{v}</p>
              <p className="text-[11px] text-midnight/60">{l}</p>
            </div>
          ))}
        </div>
        <p className="w-full text-sm text-coral">🔥 {streak}-day swipe streak — keep it going!</p>
      </div>

      <Section icon={ShoppingBag} title="Shopping interests" sub="Shapes your swipe deck and recommendations">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => toggleInterest(c.id)} className={cn("chip", prefs.interests.includes(c.id) && "chip-active")}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {BUDGETS.map((b) => (
            <button key={b.id} onClick={() => setPrefs({ budget: prefs.budget === b.id ? null : b.id })} className={cn("chip", prefs.budget === b.id && "chip-active")}>
              {b.label}
            </button>
          ))}
        </div>
      </Section>

      <Section icon={Store} title="Favourite retailers" sub="We'll highlight offers from these stores">
        <div className="flex flex-wrap gap-2">
          {ALL_RETAILERS.map((r) => (
            <button key={r} onClick={() => togglePlatform(r)} className={cn("chip", prefs.platforms.includes(r) && "chip-active")}>
              <RetailerBadge id={r} size="xs" /> {retailerById(r).name}
            </button>
          ))}
        </div>
      </Section>

      <Section icon={Bell} title="Notifications" sub="Price drops, restocks and deals">
        {(
          [
            ["drops", "Price drop alerts"],
            ["restock", "Back-in-stock alerts"],
            ["digest", "Weekly deals digest from Lovioo AI"],
          ] as const
        ).map(([k, label]) => (
          <div key={k} className="flex items-center justify-between border-b border-line/70 py-3 last:border-0">
            <span className="text-sm">{label}</span>
            <button
              role="switch"
              aria-checked={notify[k]}
              aria-label={label}
              onClick={() => setNotify((n) => ({ ...n, [k]: !n[k] }))}
              className={cn("relative h-7 w-12 rounded-full transition", notify[k] ? "bg-pink" : "bg-line")}
            >
              <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", notify[k] ? "left-6" : "left-1")} />
            </button>
          </div>
        ))}
      </Section>

      <div className="card divide-y divide-line/70">
        {[
          ...(isStaff ? [{ icon: BarChart3, label: "Open Lovioo Business", href: "/admin" }] : []),
          { icon: Sparkles, label: "Redo onboarding", href: "/onboarding" },
          { icon: Shield, label: "Privacy policy", href: "/privacy" },
          { icon: HelpCircle, label: "Terms of use", href: "/terms" },
        ].map((row) => (
          <Link key={row.label} href={row.href} className="flex items-center gap-3 p-4 text-sm font-medium hover:bg-blush/40">
            <row.icon className="h-5 w-5 text-pink" /> <span className="flex-1">{row.label}</span> <ChevronRight className="h-4 w-4 text-midnight/30" />
          </Link>
        ))}
        <button
          onClick={async () => {
            await getSupabase()?.auth.signOut();
            signOut();
            router.push("/");
          }}
          className="flex w-full items-center gap-3 p-4 text-left text-sm font-medium text-coral hover:bg-blush/40"
        >
          <LogOut className="h-5 w-5" /> Sign out
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, sub, children }: { icon: React.ElementType; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-pink/10 text-pink">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold">{title}</h2>
          <p className="text-xs text-midnight/50">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
