import Link from "next/link";
import { CATEGORIES } from "@/lib/data/categories";
import { categoryHasProducts } from "@/lib/data/products";
import { CategoryCard } from "./CategoryCard";

export function CategoryBubbles() {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {CATEGORIES.filter((c) => categoryHasProducts(c.id)).map((c) => (
        <Link key={c.id} href={`/search?category=${c.id}`} className="group shrink-0 snap-start transition active:scale-[0.98]">
          <CategoryCard category={c} className="h-[188px] w-[150px]" />
        </Link>
      ))}
      <Link href="/search" className="group shrink-0 snap-start transition active:scale-[0.98]">
        <span className="flex h-[188px] w-[150px] flex-col justify-between rounded-3xl bg-brand p-3.5 text-white">
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-white/80">Everything</span>
            <span className="mt-0.5 block text-[15px] font-bold leading-tight tracking-[-0.01em]">All products</span>
          </span>
          <span className="text-4xl transition group-hover:-translate-y-1" aria-hidden>
            ✨
          </span>
        </span>
      </Link>
    </div>
  );
}
