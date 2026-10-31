"use client";

import type { Session } from "@supabase/supabase-js";
import { BarChart3, ExternalLink, Link2, LogOut, Menu, Package, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { CONTACT_EMAIL } from "@/lib/site";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

export type PartnerBrand = Database["public"]["Functions"]["my_partner_brands"]["Returns"][number];

const NAV = [
  { href: "/partner", label: "Dashboard", icon: BarChart3 },
  { href: "/partner/products", label: "Products", icon: Package },
  { href: "/partner/links", label: "Referral links", icon: Link2 },
  { href: "/partner/account", label: "Account", icon: UserRound },
];

type Access =
  | { state: "loading" }
  | { state: "signed-out" }
  | { state: "denied"; email: string }
  | { state: "ok"; email: string; userId: string; brands: PartnerBrand[] }
  | { state: "error"; message: string };

const PartnerContext = createContext<{ brand: PartnerBrand; brands: PartnerBrand[]; email: string; userId: string } | null>(null);

/** The brand the partner is working on (most partners have exactly one), plus their login. */
export function usePartner() {
  const ctx = useContext(PartnerContext);
  if (!ctx) throw new Error("usePartner must be used inside PartnerShell");
  return ctx;
}

const PICK = "lovioo-partner-brand";

/**
 * Lovioo Brand Partner portal. Access comes from public.brand_members (my_partner_brands()); the database enforces
 * what a partner can read and write, this shell only shapes the screens.
 */
export function PartnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [access, setAccess] = useState<Access>({ state: "loading" });
  const [picked, setPicked] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    try {
      setPicked(localStorage.getItem(PICK));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const check = async (session: Session | null) => {
      if (!session) return setAccess({ state: "signed-out" });
      const { data, error } = await sb.rpc("my_partner_brands");
      if (error) return setAccess({ state: "error", message: error.message });
      const email = session.user.email ?? "";
      setAccess(data?.length ? { state: "ok", email, userId: session.user.id, brands: data } : { state: "denied", email });
    };
    sb.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setTimeout(() => check(session), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) return <Gate title="Lovioo Brand Partners isn't connected" emoji="🔌">Supabase isn&apos;t configured for this site.</Gate>;
  if (access.state === "loading") return <div className="grid min-h-screen place-items-center bg-white text-sm text-ink/50">Checking access…</div>;
  if (access.state === "signed-out")
    return (
      <Gate title="Lovioo Brand Partners" emoji="🤝" action={{ href: "/auth?mode=signin&next=/partner", label: "Sign in" }}>
        Sign in with the email and password Lovioo gave your brand.
      </Gate>
    );
  if (access.state === "denied")
    return (
      <Gate title="This account isn't a Brand Partner" emoji="🙅" action={{ href: "/", label: "Back to Lovioo" }}>
        You&apos;re signed in as <b>{access.email}</b>. To become a Lovioo Brand Partner, email <b>{CONTACT_EMAIL}</b>.
      </Gate>
    );
  if (access.state === "error") return <Gate title="Couldn't check partner access" emoji="⚠️">{access.message}</Gate>;

  const brand = access.brands.find((b) => b.id === picked) ?? access.brands[0];
  const pick = (id: string) => {
    setPicked(id);
    try {
      localStorage.setItem(PICK, id);
    } catch {
      /* ignore */
    }
  };

  const nav = (
    <nav className="space-y-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/partner" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn("flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition", active ? "bg-pink text-white shadow-pop" : "text-ink/65 hover:bg-pink-soft hover:text-ink")}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );

  const brandPicker = (
    <div className="rounded-2xl bg-pink-soft/60 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-pink">Brand Partner</p>
      {access.brands.length > 1 ? (
        <select value={brand.id} onChange={(e) => pick(e.target.value)} className="mt-1 w-full rounded-xl border border-ink/10 bg-white px-2 py-1.5 text-sm font-bold" aria-label="Brand">
          {access.brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      ) : (
        <p className="mt-0.5 truncate text-[15px] font-bold">{brand.name}</p>
      )}
    </div>
  );

  const footer = (
    <div className="space-y-1 border-t border-ink/10 pt-4 text-sm">
      <Link href={`/brand/${brand.id}`} className="flex items-center gap-3 rounded-2xl px-4 py-2 text-ink/55 hover:text-ink">
        <ExternalLink className="h-4 w-4" /> View my brand page
      </Link>
      <button onClick={() => getSupabase()?.auth.signOut()} className="flex w-full items-center gap-3 rounded-2xl px-4 py-2 text-ink/55 hover:text-ink">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
      <p className="truncate px-4 pt-2 text-[11px] text-ink/40">{access.email}</p>
      <LegalLinks className="!justify-start px-3 pt-1" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r border-ink/[0.06] bg-white p-5 lg:flex">
        <PartnerLogo />
        {brandPicker}
        <div className="flex-1">{nav}</div>
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/[0.06] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <PartnerLogo />
        <button onClick={() => setMenu(true)} className="grid h-10 w-10 place-items-center rounded-full text-ink" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </header>
      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-5 overflow-y-auto bg-white p-5">
            <div className="flex items-center justify-between">
              <PartnerLogo />
              <button onClick={() => setMenu(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {brandPicker}
            <div className="flex-1">{nav}</div>
            {footer}
          </div>
        </div>
      )}

      <main className="min-w-0 bg-[#FBFAFC] px-4 py-6 lg:ml-64 lg:min-h-screen lg:px-8 lg:py-8">
        <PartnerContext.Provider value={{ brand, brands: access.brands, email: access.email, userId: access.userId }}>{children}</PartnerContext.Provider>
      </main>
    </div>
  );
}

function PartnerLogo() {
  return (
    <Link href="/partner" className="flex items-center gap-2">
      <Logo />
      <span className="rounded-full bg-pink-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pink">Partners</span>
    </Link>
  );
}

function Gate({ title, emoji, children, action }: { title: string; emoji: string; children: React.ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="grid min-h-screen place-items-center bg-white p-6">
      <div className="max-w-md rounded-[2rem] p-8 text-center ring-1 ring-ink/[0.06]">
        <Logo tagline />
        <p className="mt-6 text-5xl">{emoji}</p>
        <h1 className="mt-3 text-[20px] leading-[1.5]">{title}</h1>
        <p className="mt-2 text-sm text-ink/70">{children}</p>
        {action && (
          <Link href={action.href} className="btn-primary mt-6">
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
