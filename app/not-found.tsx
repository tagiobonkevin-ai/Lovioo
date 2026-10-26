import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { LegalLinks } from "@/components/legal/LegalLinks";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-brand-soft p-6 text-center">
      <div>
        <Logo tagline />
        <p className="mt-10 text-7xl">💔</p>
        <h1 className="mt-4 text-[30px] leading-[1.35]">We couldn&apos;t find that one</h1>
        <p className="mt-2 text-ink/60">It may have sold out of the internet. Let&apos;s find you something new to love.</p>
        <Link href="/swipe" className="btn-gradient mt-6">
          Start swiping
        </Link>
        <LegalLinks className="mt-10" />
      </div>
    </div>
  );
}
