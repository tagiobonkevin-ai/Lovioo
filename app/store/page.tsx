import { ArrowRight, Handshake } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { HomeHeader } from "@/components/landing/HomeHeader";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata = {
  title: "Lovioo Store · Coming soon",
  description: "Shop straight from Lovioo Brand Partners. Coming soon to Lovioo.",
};

/** Lovioo Store isn't open yet: a public "coming soon" page. The finished store lives in components/store/StoreView. */
export default function LoviooStoreComingSoon() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-ui text-ink antialiased">
      <HomeHeader />
      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-pink-soft text-pink" aria-hidden>
          <Handshake className="h-7 w-7" />
        </span>
        <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.18em] text-pink">Lovioo Store</p>
        <h1 className="mt-3 font-display text-[42px] font-medium leading-[1.12] tracking-[-0.012em] sm:text-[56px]">
          Coming <span className="text-pink">Soon.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-[16px] leading-relaxed text-ink/60">
          Shop straight from our Brand Partners: products added by the brands themselves and checked by the Lovioo team. We&apos;re getting it ready
          for you.
        </p>
        <Link
          href="/discover"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-pink px-6 py-3 text-[15px] font-bold text-white shadow-pop transition hover:brightness-105"
        >
          Keep Discovering <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-6 text-[13px] text-ink/50">
          Are you a brand? Email <b className="text-ink/70">{CONTACT_EMAIL}</b> to become a Lovioo Brand Partner.
        </p>
      </main>
      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-[1248px] flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between lg:px-6">
          <Logo />
          <LegalLinks />
        </div>
      </footer>
    </div>
  );
}
