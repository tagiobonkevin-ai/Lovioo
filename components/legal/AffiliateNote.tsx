import Link from "next/link";
import { cn } from "@/lib/utils";

/** The affiliate disclosure shown next to store links, linking to the full page. */
export function AffiliateNote({ className, compact, light }: { className?: string; compact?: boolean; light?: boolean }) {
  return (
    <p className={cn("text-[11px] leading-snug", light ? "text-white/70" : "text-midnight/45", className)}>
      {compact ? "Affiliate links · " : "Some store links are affiliate links: Lovioo may earn a commission at no extra cost to you. "}
      <Link href="/affiliate-disclosure" className={cn("font-semibold underline decoration-dotted underline-offset-2", light ? "hover:text-white" : "hover:text-pink")}>
        {compact ? "Disclosure" : "Affiliate disclosure"}
      </Link>
    </p>
  );
}
