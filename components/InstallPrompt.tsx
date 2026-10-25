"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Share, SquarePlus, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const KEY = "lovioo-install";
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as { visits?: number; dismissed?: number };
  } catch {
    return {};
  }
};
const write = (v: { visits?: number; dismissed?: number }) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
};

/** Registers the service worker and, on phones from the 2nd visit, suggests adding Lovioo to the home screen. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [show, setShow] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    if (standalone || !mobile) return;

    const state = read();
    const visits = (state.visits ?? 0) + 1;
    write({ ...state, visits });
    const recentlyDismissed = state.dismissed && Date.now() - state.dismissed < 14 * 86_400_000;
    if (visits < 2 || recentlyDismissed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
      setShow("android");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const t = ios ? window.setTimeout(() => setShow("ios"), 4000) : undefined;
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (t) window.clearTimeout(t);
    };
  }, []);

  const close = () => {
    write({ ...read(), dismissed: Date.now() });
    setShow(null);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-line md:hidden"
          role="dialog"
          aria-label="Install Lovioo"
        >
          <button onClick={close} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-midnight/40" aria-label="Not now">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 pr-8">
            <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-2xl shadow-soft" />
            <div>
              <p className="text-sm font-extrabold">Get the Lovioo app</p>
              <p className="text-xs text-midnight/60">Add Lovioo to your home screen — full-screen swiping, one tap away.</p>
            </div>
          </div>
          {show === "android" ? (
            <button
              onClick={async () => {
                await deferred?.prompt();
                setShow(null);
              }}
              className="btn-gradient mt-3 w-full"
            >
              <SquarePlus className="h-4 w-4" /> Install app
            </button>
          ) : (
            <p className="mt-3 flex flex-wrap items-center gap-1 rounded-2xl bg-cream p-3 text-xs text-midnight/70">
              Tap <Share className="h-4 w-4 text-signal" /> <b>Share</b>, then <b>Add to Home Screen</b> <SquarePlus className="h-4 w-4" />
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
