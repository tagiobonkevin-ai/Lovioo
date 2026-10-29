"use client";

import { Heart, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { useHydrated } from "@/components/Providers";
import { useLovioo } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/discover", label: "Discover" },
  { href: "/swipe", label: "Swipe", badge: "💘" },
  { href: "/brands", label: "Brands" },
  { href: "/search", label: "Categories" },
  { href: "/search?sort=discount", label: "Deals" },
  { href: "/ai", label: "Lovioo AI" },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useLovioo((s) => s.user);
  const savedCount = useLovioo((s) => s.saved.length);
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1248px] items-center gap-2 px-4 sm:gap-4 lg:px-6">
        <Link href="/discover" aria-label="Lovioo home">
          <Logo />
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = pathname === n.href.split("?")[0] && (n.href.includes("?") ? false : true);
            return (
              <Link
                key={n.label}
                href={n.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm transition",
                  active ? "bg-pink/[0.07] font-medium text-pink" : "text-ink/60 hover:text-ink",
                )}
              >
                {n.label}
                {n.badge && <span className="ml-1">{n.badge}</span>}
              </Link>
            );
          })}
        </nav>

        <form
          className="ml-auto hidden max-w-xs flex-1 lg:block"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, brands or stores"
              className="w-full rounded-full border border-ink/15 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-ink/40"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:ml-0">
          <Link href="/search" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white lg:hidden" aria-label="Search">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/ai" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white lg:hidden" aria-label="Lovioo AI">
            <Sparkles className="h-5 w-5 text-grape" />
          </Link>
          <Link href="/saved" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-white" aria-label="Saved items">
            <Heart className="h-5 w-5" />
            {hydrated && savedCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-pink px-1 text-[10px] font-bold text-white">
                {savedCount}
              </span>
            )}
          </Link>
          {hydrated && user ? (
            <Link href="/profile" className="grid h-10 w-10 place-items-center rounded-full bg-brand text-sm font-bold text-white" aria-label="Profile">
              {user.name[0]?.toUpperCase()}
            </Link>
          ) : (
            <Link href="/auth" className="btn-primary hidden !py-2 sm:inline-flex">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
