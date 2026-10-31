"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";

const LINKS = [
  { href: "/discover", label: "Discover", note: "Explore products" },
  { href: "/crush", label: "Brand Crush", note: "Curated discoveries" },
  { href: "/store", label: "Lovioo Store", note: "Coming soon", soon: true },
  { href: "/ai", label: "Ask Lovioo AI", note: "Smart shopping" },
  { href: "/saved", label: "My Wishlist", note: "Saved favourites" },
];

/** The home page header: four destinations and one call to action; on phones the links sit behind a menu button. */
export function HomeHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-20 mx-auto flex h-16 max-w-[1248px] items-center gap-6 px-4 lg:px-6">
      <Link href="/" aria-label="Lovioo home">
        <Logo />
      </Link>
      <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink/70 transition hover:bg-white hover:text-ink">
            {l.label}
            {"soon" in l && <span className="ml-1.5 rounded-full bg-pink-soft px-1.5 py-0.5 text-[10px] font-bold text-pink">Soon</span>}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <Link href="/auth?mode=signin" className="hidden px-3 py-2 text-sm font-semibold text-ink/65 transition hover:text-ink sm:block">
          Sign in
        </Link>
        <Link href="/discover" className="inline-flex items-center gap-1.5 rounded-full bg-pink px-4 py-2 text-sm font-bold text-white shadow-pop transition hover:brightness-105">
          Start Discovering <ArrowRight className="hidden h-4 w-4 sm:block" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="home-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-ink ring-1 ring-ink/10 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav id="home-menu" aria-label="Main" className="absolute inset-x-4 top-16 rounded-3xl bg-white p-2 shadow-[0_24px_60px_-20px_rgba(17,17,17,0.3)] ring-1 ring-pink/15 lg:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 hover:bg-pink-soft">
              <span className="block text-[15px] font-bold">{l.label}</span>
              <span className="block text-[12px] text-ink/55">{l.note}</span>
            </Link>
          ))}
          <Link href="/auth?mode=signin" onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-[15px] font-bold text-pink hover:bg-pink-soft">
            Sign in
          </Link>
        </nav>
      )}
    </header>
  );
}
