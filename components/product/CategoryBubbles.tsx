import Link from "next/link";
import { CATEGORIES } from "@/lib/data/categories";
import { categoryHasProducts } from "@/lib/data/products";

export function CategoryBubbles() {
  return (
    <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:justify-between sm:px-0">
      {CATEGORIES.filter((c) => categoryHasProducts(c.id)).map((c) => (
        <Link key={c.id} href={`/search?category=${c.id}`} className="group flex w-20 shrink-0 flex-col items-center gap-2 text-center">
          <span
            className="grid h-16 w-16 place-items-center rounded-full text-3xl shadow-sm ring-4 ring-white transition group-hover:-translate-y-1 group-hover:shadow-pop"
            style={{ background: c.tint }}
          >
            {c.emoji}
          </span>
          <span className="text-[11px] font-medium leading-tight text-ink/80">{c.name.split(" &")[0]}</span>
        </Link>
      ))}
      <Link href="/search" className="group flex w-20 shrink-0 flex-col items-center gap-2 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-lavender text-2xl shadow-sm ring-4 ring-white transition group-hover:-translate-y-1">
          ✨
        </span>
        <span className="text-[11px] font-medium text-ink/80">All</span>
      </Link>
    </div>
  );
}
