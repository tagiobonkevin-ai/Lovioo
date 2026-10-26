import { cn } from "@/lib/utils";

export function scoreColor(score: number) {
  if (score >= 80) return "#10B981";
  if (score >= 55) return "#FFB84D";
  return "#FF6B4A";
}

export function DealScoreRing({ score, size = 56, label = true, className }: { score: number; size?: number; label?: boolean; className?: string }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#F1E6EC" strokeWidth={5} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={scoreColor(score)}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <span className="absolute text-center leading-none">
        <span className="block text-sm font-bold">{score}</span>
        {label && <span className="block text-[8px] uppercase tracking-wide text-ink/50">deal</span>}
      </span>
    </div>
  );
}

export function DiscountBadge({ pct, className }: { pct: number; className?: string }) {
  if (pct <= 0) return null;
  return <span className={cn("rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600", className)}>-{pct}%</span>;
}
