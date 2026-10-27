import { HALLOWEEN_NOTE, isHalloween } from "@/lib/season";
import { cn } from "@/lib/utils";

/**
 * The small seasonal line above the headline. Nothing else about the page changes: same layout, same type,
 * same colours. It disappears by itself after 5 November.
 */
export function HalloweenNote({ className }: { className?: string }) {
  if (!isHalloween()) return null;
  return (
    <p className={cn("text-[11px] font-medium uppercase tracking-[0.14em] text-ink/45", className)}>
      <span aria-hidden>{HALLOWEEN_NOTE.slice(0, 2)}</span> {HALLOWEEN_NOTE.slice(3)}
    </p>
  );
}

const PUMPKINS = [
  { emoji: "🎃", left: "4%", top: "8%", size: "text-3xl", delay: "0s" },
  { emoji: "👻", left: "88%", top: "14%", size: "text-2xl", delay: "1.2s" },
  { emoji: "🦇", left: "14%", top: "62%", size: "text-xl", delay: "2.1s" },
  { emoji: "🕸️", left: "80%", top: "70%", size: "text-2xl", delay: "0.6s" },
  { emoji: "🍬", left: "48%", top: "4%", size: "text-lg", delay: "1.7s" },
];

/**
 * Faint pumpkins drifting behind the hero. Decorative only: no pointer events, hidden from screen readers,
 * and still when the visitor asks for reduced motion.
 */
export function HalloweenDecor() {
  if (!isHalloween()) return null;
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {PUMPKINS.map((p) => (
        <span
          key={p.emoji}
          className={cn("absolute animate-floaty opacity-[0.13] motion-reduce:animate-none", p.size)}
          style={{ left: p.left, top: p.top, animationDelay: p.delay }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
