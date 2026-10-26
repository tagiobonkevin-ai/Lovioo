"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AiChat } from "./AiChat";

/** Floating Lovioo AI button + slide-over chat, available on every app page except the full chat page. */
export function AiFab() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  if (pathname === "/ai" || pathname === "/swipe") return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 hidden items-center gap-2 rounded-full bg-dusk px-5 py-3 text-sm font-semibold text-white shadow-pop transition hover:scale-105 lg:inline-flex"
      >
        <Sparkles className="h-4 w-4" /> Ask Lovioo AI
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-midnight/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-cream shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              role="dialog"
              aria-label="Lovioo AI"
            >
              <div className="flex items-center justify-between border-b border-line/70 px-5 py-4">
                <span className="flex items-center gap-2 font-bold">
                  <Sparkles className="h-5 w-5 text-grape" /> Lovioo AI
                </span>
                <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <AiChat compact />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
