"use client";

import { useState } from "react";
import type { Brand } from "@/lib/data/brands";
import { cn } from "@/lib/utils";

/** Brand logo, or the brand's initials on its colour when there's no logo (or it fails to load). */
export function BrandAvatar({ brand, className }: { brand: Brand; className?: string }) {
  const [failed, setFailed] = useState(false);
  const initials = brand.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-white font-extrabold text-white", className)} style={{ background: brand.logo && !failed ? "#fff" : brand.color }}>
      {brand.logo && !failed ? <img src={brand.logo} alt="" className="h-full w-full object-contain p-1.5" onError={() => setFailed(true)} /> : initials}
    </span>
  );
}
