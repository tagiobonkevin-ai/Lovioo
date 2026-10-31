"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Product photo with a branded emoji tile fallback when the remote image can't load. */
export function ProductImage({
  product,
  className,
  emojiSize = "text-6xl",
}: {
  product: Pick<Product, "image" | "name" | "emoji" | "category">;
  className?: string;
  emojiSize?: string;
}) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  // A server-rendered <img> can fail before React attaches onError, so check once on mount.
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);
  return (
    // Brand light pink behind every product photo, so products of any category sit on the same backdrop.
    <div className={cn("relative overflow-hidden", className)} style={{ background: "radial-gradient(circle at 30% 20%, #fff 0%, #FFE8F1 70%)" }}>
      {!failed ? (
        <img
          ref={img}
          src={product.image}
          alt={product.name}
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
          className="h-full w-full select-none object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center">
          <span className={cn("drop-shadow-sm", emojiSize)} aria-hidden>
            {product.emoji}
          </span>
        </div>
      )}
    </div>
  );
}
