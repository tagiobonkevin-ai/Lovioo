import Link from "next/link";
import { CATEGORIES } from "@/lib/data/categories";
import { categoryHasProducts } from "@/lib/data/products";
import { CategoryCard } from "./CategoryCard";

export function CategoryBubbles() {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {CATEGORIES.filter((c) => categoryHasProducts(c.id)).map((c) => (
        <Link key={c.id} href={`/search?category=${c.id}`} className="group shrink-0 snap-start transition active:scale-[0.98]">
          <CategoryCard category={c} className="h-[188px] w-[150px]" />
        </Link>
      ))}
      <Link href="/search" className="group shrink-0 snap-start transition active:scale-[0.98]">
        <span className="flex h-[188px] w-[150px] flex-col justify-between rounded-xl bg-lavender p-3 text-ink">
          <span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.08em] text-ink/60">Everything</span>
            <span className="mt-0.5 block font-display text-[16px] font-medium leading-tight tracking-[-0.009em]">All products</span>
          </span>
          <span className="text-4xl transition group-hover:-translate-y-1" aria-hidden>
            ✨
          </span>
        </span>
      </Link>
    </div>
  );
}
