import { useId } from "react";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" className={cn("h-8 w-8", className)} aria-hidden>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF2DDB" />
          <stop offset="45%" stopColor="#FF2D9A" />
          <stop offset="75%" stopColor="#FF6B4A" />
          <stop offset="100%" stopColor="#FFB84D" />
        </linearGradient>
      </defs>
      <path
        d="M14 10.5c0-5.4 5.8-8.8 10.5-6.1l30 17.4c4.7 2.7 4.7 9.5 0 12.2l-30 17.4C19.8 54 14 50.6 14 45.2z"
        transform="translate(0 4)"
        fill={`url(#g${id})`}
      />
      <path
        d="M27 27.6c-2.6-3.3-8-1.6-8 2.7 0 3.6 4.4 6.6 8 9.4 3.6-2.8 8-5.8 8-9.4 0-4.3-5.4-6-8-2.7z"
        fill="#fff"
      />
    </svg>
  );
}

export function Logo({ className, tagline = false, light = false, mono = false }: { className?: string; tagline?: boolean; light?: boolean; mono?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <LogoMark />
      <span className="leading-none">
        <span className={cn("text-[1.45rem] font-extrabold tracking-tight", light ? "text-white" : mono ? "text-ink" : "text-midnight")}>
          Lovi<span className={mono ? undefined : "text-gradient"}>oo</span>
        </span>
        {tagline && (
          <span className={cn("block text-[0.6rem] tracking-[0.3em]", light ? "text-white/80" : mono ? "text-ink/55" : "text-midnight/70")}>
            Swipe. <span className={mono ? undefined : "text-pink"}>Love.</span> Shop.
          </span>
        )}
      </span>
    </span>
  );
}
