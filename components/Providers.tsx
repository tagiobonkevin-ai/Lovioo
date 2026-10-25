"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { applyCatalog, type Catalog } from "@/lib/data/catalog";
import { useLovioo } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AuthSync } from "./AuthSync";

interface Toast {
  id: number;
  title: string;
  body?: string;
  kind?: "heart" | "ok" | "error";
}

export const useToasts = create<{ toasts: Toast[]; push: (t: Omit<Toast, "id">) => void }>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set({ toasts: [...get().toasts, { ...t, id }] });
    setTimeout(() => set({ toasts: get().toasts.filter((x) => x.id !== id) }), 2600);
  },
}));

export const toast = (t: Omit<Toast, "id">) => useToasts.getState().push(t);

const useHydrationFlag = create<{ ready: boolean }>(() => ({ ready: false }));

/** True once the persisted store has loaded from localStorage — gate user-specific UI on this. */
export const useHydrated = () => useHydrationFlag((s) => s.ready);

export function Providers({ children, catalog }: { children: React.ReactNode; catalog: Catalog | null }) {
  // Runs before any child renders, on the server (SSR) and in the browser, so both see the same catalog.
  useState(() => catalog && applyCatalog(catalog));

  useEffect(() => {
    const done = () => useHydrationFlag.setState({ ready: true });
    const p = useLovioo.persist.rehydrate();
    if (p && "then" in p) p.then(done);
    else done();
  }, []);

  return (
    <>
      {children}
      <AuthSync />
      <ToastViewport />
    </>
  );
}

function ToastViewport() {
  const toasts = useToasts((s) => s.toasts);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-midnight px-4 py-3 text-white shadow-soft"
          >
            <span className={cn("grid h-8 w-8 place-items-center rounded-full", t.kind === "error" ? "bg-coral" : "bg-brand")}>
              {t.kind === "error" ? <AlertTriangle className="h-4 w-4" /> : t.kind === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <Heart className="h-4 w-4 fill-white" />}
            </span>
            <span>
              <span className="block text-sm font-semibold">{t.title}</span>
              {t.body && <span className="block text-xs text-white/70">{t.body}</span>}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
