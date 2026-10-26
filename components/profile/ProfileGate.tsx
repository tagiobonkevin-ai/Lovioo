"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { PROFILE_FREE_PATHS, useProfileStatus } from "@/lib/profile";

/** Sends a signed-in user who hasn't added their name and birthday yet to onboarding, then back where they were. */
export function ProfileGate() {
  const needsProfile = useProfileStatus((s) => s.needsProfile);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (!needsProfile || PROFILE_FREE_PATHS.some((p) => pathname.startsWith(p))) return;
    router.replace(`/onboarding?next=${encodeURIComponent(pathname + window.location.search)}`);
  }, [needsProfile, pathname, router]);
  return null;
}
