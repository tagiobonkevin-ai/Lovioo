"use client";

import { Heart, RotateCw } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { useHydrated } from "@/components/Providers";
import { loadMemberCatalog, useMemberCatalog } from "@/lib/data/member-catalog";
import { useLovioo } from "@/lib/store";

/**
 * The full catalogue is for members: a guest is sent to sign-up and comes back here afterwards; members see a loader
 * until their catalogue has arrived. The database (RLS) only sends products to signed-in accounts, so this is the
 * experience, not the lock.
 */
export function MembersOnly({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const user = useLovioo((s) => s.user);
  const { status, error } = useMemberCatalog();
  const pathname = usePathname();
  const router = useRouter();
  const [authHref, setAuthHref] = useState("/auth");

  useEffect(() => {
    if (!hydrated || user) return;
    const href = `/auth?next=${encodeURIComponent(pathname + window.location.search)}`;
    setAuthHref(href);
    router.replace(href);
  }, [hydrated, user, pathname, router]);

  if (hydrated && !user)
    return (
      <Gate>
        <span className="grid h-12 w-12 place-items-center rounded-full bg-pink-soft text-pink">
          <Heart className="h-5 w-5" aria-hidden />
        </span>
        <h1 className="mt-4 text-[22px] leading-snug">Join free to see every product</h1>
        <p className="mt-1 max-w-xs text-sm text-ink/60">Products, prices, Swipe and your wishlist are for Lovioo members. It takes a minute.</p>
        <Link href={authHref} className="btn-primary mt-5">
          Create free account
        </Link>
      </Gate>
    );

  if (hydrated && status === "error")
    return (
      <Gate>
        <h1 className="text-[18px] leading-[1.5]">Couldn&apos;t load products</h1>
        <p className="mt-1 max-w-xs text-sm text-ink/60">{error}</p>
        <button onClick={() => user?.id && loadMemberCatalog(user.id)} className="btn-primary mt-5 inline-flex items-center gap-2">
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
