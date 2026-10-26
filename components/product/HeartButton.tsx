"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useState } from "react";
import { toast, useHydrated } from "@/components/Providers";
import { useLovioo } from "@/lib/store";
import { cn } from "@/lib/utils";

export function HeartButton({ productId, className, size = "md" }: { productId: string; className?: string; size?: "sm" | "md" | "lg" }) {
  const hydrated = useHydrated();
  const saved = useLovioo((s) => s.saved.includes(productId)) && hydrated;
  const toggleSave = useLovioo((s) => s.toggleSave);
  const [burst, setBurst] = useState(0);
  const dims = { sm: "h-8 w-8", md: "h-9 w-9", lg: "h-11 w-11" }[size];

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const now = toggleSave(productId);
        if (now) {
          setBurst((b) => b + 1);
          toast({ title: "Saved!", body: "Added to your collection." });
        }
      }}
      className={cn(className?.includes("absolute") ? "" : "relative", "grid place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-110", dims, className)}
    >
      <motion.span key={burst} initial={{ scale: burst ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 12 }}>
        <Heart className={cn("h-[18px] w-[18px] transition", saved ? "fill-pink text-pink" : "text-ink/60")} />
      </motion.span>
      <AnimatePresence>
        {burst > 0 && saved && (
          <motion.span key={`b${burst}`} className="pointer-events-none absolute inset-0" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-pink"
                initial={{ x: 0, y: 0 }}
                animate={{ x: Math.cos((i / 6) * Math.PI * 2) * 20, y: Math.sin((i / 6) * Math.PI * 2) * 20 }}
                transition={{ duration: 0.5 }}
              />
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
