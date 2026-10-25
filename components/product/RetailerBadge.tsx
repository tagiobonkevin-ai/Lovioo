import { RETAILERS } from "@/lib/data/retailers";
import type { RetailerId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RetailerBadge({ id, size = "sm", withName = false, className }: { id: RetailerId; size?: "xs" | "sm" | "md"; withName?: boolean; className?: string }) {
  const r = RETAILERS[id];
  const dims = { xs: "h-4 w-4 text-[8px]", sm: "h-5 w-5 text-[10px]", md: "h-8 w-8 text-xs" }[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)} title={r.name}>
      <span className={cn("grid shrink-0 place-items-center rounded-md font-bold", dims)} style={{ background: r.color, color: r.text }}>
        {r.short}
      </span>
      {withName && <span className="text-sm font-medium">{r.name}</span>}
    </span>
  );
}

export function RetailerStack({ ids, max = 4 }: { ids: RetailerId[]; max?: number }) {
  return (
    <span className="flex items-center gap-1">
      {ids.slice(0, max).map((id) => (
        <RetailerBadge key={id} id={id} size="xs" />
      ))}
      {ids.length > max && <span className="text-[10px] text-midnight/50">+{ids.length - max}</span>}
    </span>
  );
}
