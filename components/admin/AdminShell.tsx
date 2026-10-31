"use client";

import type { Session } from "@supabase/supabase-js";
import { BadgeCheck, BarChart3, ClipboardCheck, ExternalLink, FolderTree, Layers, LayoutDashboard, LineChart, LogOut, Menu, MessageCircleHeart, Package, ReceiptText, Settings, Store, Tag, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

/** Who sees each page. The database enforces the same rules; this only shapes the UI. */
const NAV: { href: string; label: string; icon: React.ElementType; editor?: boolean }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/insights", label: "Shopper Insights", icon: LineChart },
  { href: "/admin/products", label: "Products", icon: Package, editor: true },
  { href: "/admin/review", label: "Review queue", icon: ClipboardCheck },
  { href: "/admin/prices", label: "Price list", icon: ReceiptText, editor: true },
  { href: "/admin/brands", label: "Brands & partners", icon: BadgeCheck },
  { href: "/admin/collections", label: "Collections", icon: Layers },
  { href: "/admin/retailers", label: "Retailer sources", icon: Store },
  { href: "/admin/deals", label: "Deals & alerts", icon: Tag },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/users", label: "Shoppers", icon: Users },
  { href: "/admin/feedback", label: "Feedback", icon: MessageCircleHeart },
  { href: "/admin/settings", label: "Team & roles", icon: Settings },
];

export const ROLE_LABELS: Record<AppRole, string> = { customer: "Customer", editor: "Editor", admin: "Admin", super_admin: "Super admin" };

type StaffRole = Exclude<AppRole, "customer">;
type Access =
  | { state: "loading" }
  | { state: "signed-out" }
  | { state: "denied"; email: string }
  | { state: "ok"; email: string; role: StaffRole }
  | { state: "error"; message: string };

const RoleContext = createContext<StaffRole>("editor");
/** The signed-in staff member's role, for hiding actions they can't take. */
export const useAdminRole = () => useContext(RoleContext);
export const isAdminRole = (r: AppRole) => r === "admin" || r === "super_admin";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [access, setAccess] = useState<Access>({ state: "loading" });
  const [menu, setMenu] = useState(false);

  useEffect(() => setMenu(false), [pathname]);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const check = async (session: Session | null) => {
      if (!session) return setAccess({ state: "signed-out" });
      const { data: role, error } = await sb.rpc("current_app_role");
      if (error) return setAccess({ state: "error", message: error.message });
      const email = session.user.email ?? "";
      setAccess(role && role !== "customer" ? { state: "ok", email, role } : { state: "denied", email });
    };
    sb.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setTimeout(() => check(session), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const role = access.state === "ok" ? access.role : null;
  const waiting = useReviewCount(role !== null && isAdminRole(role), pathname);
  const allowed = (href: string) => role !== null && (isAdminRole(role) || !!NAV.find((n) => n.href === href)?.editor);
  const pageAllowed = role !== null && (isAdminRole(role) || NAV.some((n) => n.editor && pathname.startsWith(n.href)));

  // Editors only have the product catalog; send them there from any other admin page.
  useEffect(() => {
    if (role && !pageAllowed) router.replace("/admin/products");
  }, [role, pageAllowed, router]);

  if (!isSupabaseConfigured) {
    return (
      <Gate title="Connect Supabase to use the admin" emoji="🔌">
        Set <code className="rounded bg-lavender px-1.5">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-lavender px-1.5">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>, then restart the app. The shopper site keeps working on demo data without them.
      </Gate>
    );
  }
  if (access.state === "loading") return <div className="grid min-h-screen place-items-center bg-ink/[0.03] text-sm text-ink/50">Checking access…</div>;
  if (access.state === "signed-out")
    return (
      <Gate title="Sign in to Lovioo Business" emoji="🔐" action={{ href: "/auth?mode=signin&next=/admin", label: "Sign in" }}>
        Use an account whose email is on the admin list.
      </Gate>
    );
  if (access.state === "denied")
    return (
      <Gate title="This account isn't an admin" emoji="🙅" action={{ href: "/discover", label: "Back to Lovioo" }}>
        You&apos;re signed in as <b>{access.email}</b>. A super admin can give you access under Team &amp; roles. New accounts also need a confirmed email address.
      </Gate>
    );
  if (access.state === "error") return <Gate title="Couldn't check admin access" emoji="⚠️">{access.message}</Gate>;
  if (!pageAllowed) return <div className="grid min-h-screen place-items-center bg-ink/[0.03] text-sm text-ink/50">Opening products…</div>;

  const nav = (
    <nav className="space-y-1">
      {NAV.filter((n) => allowed(n.href)).map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        const badge = href === "/admin/review" ? waiting : 0;
        return (
          <Link
            key={href}
            href={href}
            className={cn("flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition", active ? "bg-pink text-white shadow-pop" : "text-white/70 hover:bg-white/5 hover:text-white")}
          >
            <Icon className="h-4 w-4" /> {label}
            {badge > 0 && (
              <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold", active ? "bg-white text-pink" : "bg-pink text-white")} aria-label={`${badge} waiting`}>
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="space-y-1 border-t border-white/10 pt-4 text-sm">
      <Link href="/discover" className="flex items-center gap-3 rounded-2xl px-4 py-2 text-white/60 hover:text-white">
        <ExternalLink className="h-4 w-4" /> View shopper site
      </Link>
      <button
        onClick={async () => {
          await getSupabase()?.auth.signOut();
        }}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-2 text-white/60 hover:text-white"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
      <p className="truncate px-4 pt-2 text-[11px] text-white/40">
        {access.email} · {ROLE_LABELS[access.role]}
      </p>
      <LegalLinks light className="!justify-start px-3 pt-1" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F3F7]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-8 bg-ink p-5 lg:flex">
        <BusinessLogo />
        <div className="flex-1">{nav}</div>
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 lg:hidden">
        <BusinessLogo />
        <button onClick={() => setMenu(true)} className="grid h-10 w-10 place-items-center rounded-full text-white" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </header>
      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-6 bg-ink p-5">
            <div className="flex items-center justify-between">
              <BusinessLogo />
              <button onClick={() => setMenu(false)} className="text-white" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1">{nav}</div>
            {footer}
          </div>
        </div>
      )}

      <main className="px-4 py-6 lg:ml-64 lg:px-8 lg:py-8">
        <RoleContext.Provider value={access.role}>{children}</RoleContext.Provider>
      </main>
    </div>
  );
}

/** Drafts submitted for review plus pending change requests, refreshed on each admin page change. */
function useReviewCount(enabled: boolean, pathname: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const sb = getSupabase();
    if (!enabled || !sb) return;
    let live = true;
    Promise.all([
      sb.from("products").select("id", { count: "exact", head: true }).eq("published", false).not("review_requested_at", "is", null),
      sb.from("product_change_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]).then(([drafts, changes]) => {
      if (live) setCount((drafts.count ?? 0) + (changes.count ?? 0));
    });
    return () => {
      live = false;
    };
  }, [enabled, pathname]);
  return count;
}

function BusinessLogo() {
  return (
    <Link href="/admin" className="flex items-center gap-2">
      <Logo light />
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80">
        <BarChart3 className="mr-1 inline h-3 w-3" />
        Business
      </span>
    </Link>
  );
}

function Gate({ title, emoji, children, action }: { title: string; emoji: string; children: React.ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="grid min-h-screen place-items-center bg-brand-soft p-6">
      <div className="card max-w-md p-8 text-center">
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
