"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Heart, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LogoMark } from "@/components/brand/Logo";
import type { CrushStory } from "@/lib/data/crush";
import { saveOrJoin } from "@/lib/signup-nudge";
import { useLovioo } from "@/lib/store";
import { cn, peso } from "@/lib/utils";

const SLIDE_MS = 5000;

/**
 * Crush Stories: Lovioo's collections as tap-through stories, like the ones on Instagram. Each story opens on a bold
 * pink title card, shows its real products one per slide and ends on a link to the whole collection.
 */
export function CrushStories({ stories, className }: { stories: CrushStory[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!stories.length) return null;
  return (
    <>
      <div className={cn("no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1", className)} role="list" aria-label="Crush Stories">
        {stories.map((s, i) => {
          const cover = s.products.find((p) => p.image);
          return (
            <button key={s.slug} role="listitem" onClick={() => setOpen(i)} className="group flex w-[76px] shrink-0 flex-col items-center gap-1.5 text-center">
              <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-brand p-[3px] transition group-hover:scale-105">
                <span className="grid h-full w-full place-items-center overflow-hidden rounded-full border-[3px] border-white bg-pink-soft text-2xl">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span aria-hidden>{s.emoji}</span>
                  )}
                </span>
              </span>
              <span className="w-full truncate text-[11px] font-semibold text-ink/75">{s.title}</span>
            </button>
          );
        })}
      </div>
      {/* Portalled to <body>: an animated (transformed) ancestor would otherwise trap the full-screen viewer. */}
      {open !== null &&
        createPortal(
          <AnimatePresence>
            <StoryViewer stories={stories} start={open} onClose={() => setOpen(null)} />
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

type Slide = { kind: "intro" } | { kind: "product"; index: number } | { kind: "outro" };

function slidesOf(story: CrushStory): Slide[] {
  return [{ kind: "intro" }, ...story.products.map((_, index) => ({ kind: "product" as const, index })), { kind: "outro" }];
}

function StoryViewer({ stories, start, onClose }: { stories: CrushStory[]; start: number; onClose: () => void }) {
  const [si, setSi] = useState(start);
  const [at, setAt] = useState(0);
  const [paused, setPaused] = useState(false);
  const story = stories[si];
  const slides = slidesOf(story);
  const slide = slides[at];
  const save = useLovioo((s) => s.save);
  const signedIn = useLovioo((s) => !!s.user);
  const saved = useLovioo((s) => s.saved);
  const closeRef = useRef<HTMLButtonElement>(null);

  const next = useCallback(() => {
    if (at < slides.length - 1) setAt(at + 1);
    else if (si < stories.length - 1) {
      setSi(si + 1);
      setAt(0);
    } else onClose();
  }, [at, slides.length, si, stories.length, onClose]);
  const prev = () => {
    if (at > 0) setAt(at - 1);
    else if (si > 0) {
      setSi(si - 1);
      setAt(0);
    }
  };

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(t);
  }, [next, paused, at, si]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next]);

  const product = slide.kind === "product" ? story.products[slide.index] : null;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${story.title} story`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] grid place-items-center bg-[#2A0A1E]/95 p-0 sm:p-6"
    >
      <div
        className={cn(
          "relative h-full w-full overflow-hidden sm:h-[min(820px,92vh)] sm:w-auto sm:aspect-[9/16] sm:rounded-[2rem]",
          slide.kind === "outro" ? "bg-white text-ink" : slide.kind === "intro" ? "bg-pink text-white" : "bg-pink-soft text-white",
        )}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        {/* Progress bars and header */}
        <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/25 to-transparent px-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/40">
                {i < at && <span className="block h-full w-full bg-white" />}
                {i === at && (
                  <motion.span
                    key={`${si}-${at}`}
                    className="block h-full bg-white"
                    initial={{ width: "0%" }}
                    animate={{ width: paused ? undefined : "100%" }}
                    transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                  />
                )}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-white">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white">
              <LogoMark className="h-5 w-5" />
            </span>
            <span className="text-[13px] font-bold drop-shadow">Lovioo · {story.title}</span>
            <button ref={closeRef} onClick={onClose} aria-label="Close story" className="ml-auto grid h-9 w-9 place-items-center rounded-full text-white drop-shadow">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tap zones: left goes back, right goes forward */}
        <button aria-label="Previous" onClick={prev} className="absolute inset-y-0 left-0 z-10 w-1/3" />
        <button aria-label="Next" onClick={next} className="absolute inset-y-0 right-0 z-10 w-2/3" />

        <AnimatePresence mode="wait">
          <motion.div
            key={`${si}-${at}`}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            {slide.kind === "intro" && (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <p className="select-none text-[64px] font-extrabold uppercase leading-none tracking-[-0.04em] text-white/15" aria-hidden>
                  Crush
                </p>
                <p className="mt-2 text-6xl" aria-hidden>
                  {story.emoji}
                </p>
                <p className="mt-6 font-display text-[44px] font-medium leading-[1.05]">{story.title}</p>
                <p className="mt-3 text-[18px] font-semibold text-white/90">{story.tagline}</p>
                <p className="mt-10 text-[12px] font-bold uppercase tracking-[0.16em] text-white/70">Tap to discover →</p>
              </div>
            )}
            {product && (
              <>
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-[8rem]" aria-hidden>
                    {product.emoji}
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-24">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/75">{product.brand}</p>
                  <p className="mt-1 line-clamp-3 font-display text-[26px] font-medium leading-[1.15]">{product.name}</p>
                  {product.price !== undefined && <p className="mt-2 text-[24px] font-extrabold">{peso(product.price)}</p>}
                  <div className="mt-4 flex gap-2">
                    <Link href={`/product/${product.slug}`} onClick={onClose} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[15px] font-bold text-ink">
                      View <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => saveOrJoin(product.id, save, signedIn)}
                      aria-label={saved.includes(product.id) ? "Saved" : "Save"}
                      className="grid h-12 w-12 place-items-center rounded-full bg-pink text-white shadow-pop"
                    >
                      <Heart className={cn("h-5 w-5", saved.includes(product.id) && "fill-white")} />
                    </button>
                  </div>
                </div>
              </>
            )}
            {slide.kind === "outro" && (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <p className="font-display text-[40px] font-medium leading-[1.1]">
                  Discover.
                  <br />
                  Swipe.
                  <br />
                  <span className="text-pink">Fall in Love.</span>
                </p>
                <Link
                  href={`/crush/${story.slug}`}
                  onClick={onClose}
                  className="relative z-20 mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-pink px-6 text-[15px] font-bold text-white shadow-pop"
                >
                  See all of {story.title} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
