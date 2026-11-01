import { Check, Circle } from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export interface ChecklistItem {
  label: string;
  done: boolean;
  /** Nice to have: doesn't count against "ready". */
  optional?: boolean;
}

/**
 * Every product page follows the same layout (photo, brand, category, price or price range, store link, colors,
 * promotions, description, reviews). This shows what's still missing so every product is as complete as the others.
 */
export function ProductChecklist({ items }: { items: ChecklistItem[] }) {
  const required = items.filter((i) => !i.optional);
  const done = required.filter((i) => i.done).length;
  return (
    <Panel title="Product page checklist" action={<span className={cn("text-xs font-bold", done === required.length ? "text-emerald-600" : "text-ink/50")}>{done}/{required.length}</span>}>
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i.label} className={cn("flex items-center gap-2 text-sm", i.done ? "text-ink/80" : "text-ink/50")}>
            {i.done ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Circle className="h-4 w-4 text-ink/25" aria-hidden />}
            {i.label}
            {i.optional && <span className="text-[11px] text-ink/35">optional</span>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
