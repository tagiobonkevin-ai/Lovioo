import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { LEGAL_UPDATED } from "@/lib/site";

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
        <Link href="/" aria-label="Lovioo home">
          <Logo />
        </Link>
        <Link href="/discover" className="text-sm font-semibold text-pink">
          Back to Lovioo
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-midnight/50">Last updated {LEGAL_UPDATED}</p>
        <p className="mt-6 text-midnight/80">{intro}</p>
        <div className="legal mt-8 space-y-8 text-[15px] leading-relaxed text-midnight/80 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-midnight [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
          {children}
        </div>
        <nav className="mt-12 flex gap-4 text-sm text-midnight/60">
          <Link href="/privacy" className="hover:text-pink">Privacy</Link>
          <Link href="/terms" className="hover:text-pink">Terms</Link>
        </nav>
      </main>
    </div>
  );
}
