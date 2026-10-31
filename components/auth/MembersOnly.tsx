"use client";

import { Heart, RotateCw } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand/Logo";
import { useHydrated } from "@/components/Providers";
import { loadMemberCatalog, useMemberCatalog } from "@/lib/data/member-catalog";
import { useLovioo } from "@/lib/store";

/** Pages that hold a person's own data; everything else (Discover, Swipe, Search, products, Brand Crush) is open. */
const PERSONAL = ["/saved", "/profile"];

/**
 * Loads the catalogue for every visitor and shows a loader until it has arrived. Guests can browse, swipe and save
 * on this phone; only the personal pages ask for an account. The database (RLS) decides what each visitor may read.
 */
export function MembersOnly({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const user = useLovioo((s) => s.user);
  const { status, error } = useMemberCatalog();
  const pathname = usePathname();
  const personal = PERSONAL.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (hydrated && !user && personal)
    return (
      <Gate>
        <span className="grid h-12 w-12 place-items-center rounded-full bg-pink-soft text-pink">
          <Heart className="h-5 w-5" aria-hidden />
        </span>
        <h1 className="mt-4 text-[22px] leading-snug">{pathname.startsWith("/saved") ? "Your wishlist lives in your account" : "Your profile needs an account"}</h1>
        <p className="mt-1 max-w-xs text-sm text-ink/60">Create a free account to save your favourites, get price alerts and pick up where you left off on any device.</p>
        <Link href={`/auth?next=${encodeURIComponent(pathname)}`} className="btn-primary mt-5">
          Create free account
        </Link>
        <Link href="/discover" className="mt-3 text-sm font-semibold text-pink">
          Keep discovering
        </Link>
      </Gate>
    );

  if (hydrated && status === "error")
    return (
      <Gate>
        <h1 className="text-[18px] leading-[1.5]">Couldn&apos;t load products</h1>
        <p className="mt-1 max-w-xs text-sm text-ink/60">{error}</p>
        <button onClick={() => loadMemberCatalog(user?.id ?? null)} className="btn-primary mt-5 inline-flex items-center gap-2">
          <RotateCw className="h-4 w-4" /> Try again
        </button>
      </Gate>
    );

  if (!hydrated || status !== "ready")
    return (
      <Gate>
        <LogoMark className="h-10 w-10 animate-pulse" />
        <p className="mt-3 text-sm text-ink/50" role="status">
          Loading your picks…
        </p>
      </Gate>
    );

  return <>{children}</>;
}

function Gate({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">{children}</div>;
}
