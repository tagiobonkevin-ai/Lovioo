"use client";

import { BadgeCheck, Home, Layers, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/discover", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/swipe", label: "Swipe", icon: Layers, center: true },
  { href: "/brand", label: "Brands", icon: BadgeCheck, to: "/brands" },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-md items-end justify-around px-2 pt-1.5">
        {TABS.map(({ href, label, icon: Icon, center, to }) => {
          const active = pathname.startsWith(href);
          if (center) {
            return (
              <Link key={href} href={href} className="-mt-6 flex flex-col items-center gap-0.5" aria-label={label}>
                <span className={cn("grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-pop ring-4 ring-white", active && "animate-wiggle")}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="pb-1.5 text-[11px] font-medium text-pink">{label}</span>
              </Link>
            );
          }
          return (
            <Link key={href} href={to ?? href} className={cn("flex flex-col items-center gap-0.5 px-3 pb-1.5 pt-1 transition active:scale-90", active ? "text-pink" : "text-ink/45")}>
              <Icon className="h-5 w-5" />
              <span className="text-[11px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
