import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { LEGAL_EFFECTIVE, LEGAL_PAGES, LEGAL_UPDATED } from "@/lib/site";
import { cn } from "@/lib/utils";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

/**
 * Shared layout for the legal documents: title, dates, a contents list (handy on phones) and the sections.
 * Pass `sections` for long documents, or `children` for free-form ones.
 */
export function LegalPage({
  title,
  intro,
  sections,
  children,
  draft = true,
  path,
}: {
  title: string;
  intro?: React.ReactNode;
  sections?: LegalSection[];
  children?: React.ReactNode;
  draft?: boolean;
  path?: string;
}) {
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
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        {draft && <span className="inline-block rounded-full bg-sunset/20 px-2.5 py-1 text-[11px] font-semibold text-[#9A5B00]">Draft for legal review</span>}
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-xs text-midnight/50">
          Effective {LEGAL_EFFECTIVE} · Last updated {LEGAL_UPDATED}
        </p>
        {intro && <div className="mt-6 text-midnight/80">{intro}</div>}

        {sections && sections.length > 3 && (
          <details className="group mt-6 rounded-2xl bg-white p-4 shadow-soft open:pb-3" open>
            <summary className="cursor-pointer list-none text-sm font-bold marker:hidden">
              Contents <span className="ml-1 text-xs font-normal text-midnight/40 group-open:hidden">({sections.length} sections)</span>
            </summary>
            <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-midnight/70 hover:text-pink">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        )}

        <div className="legal mt-8 space-y-8 text-[15px] leading-relaxed text-midnight/80 [&_a]:font-semibold [&_a]:text-pink [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-midnight [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_ul]:mt-2 [&_ul]:space-y-1.5">
          {sections?.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-6">
              <h2>{s.title}</h2>
              {s.body}
            </section>
          ))}
          {children}
        </div>

        <nav aria-label="Other legal pages" className="mt-12 grid gap-2 sm:grid-cols-4">
          {LEGAL_PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              aria-current={p.href === path ? "page" : undefined}
              className={cn("rounded-2xl bg-white px-3 py-2.5 text-center text-xs font-semibold shadow-soft transition hover:text-pink", p.href === path && "text-pink ring-1 ring-pink/30")}
            >
              {p.label}
            </Link>
          ))}
        </nav>
        <LegalLinks className="mt-6" />
      </main>
    </div>
  );
}

/** A muted box for facts about Lovioo today, or notes the legal reviewer must resolve. */
export function LegalNote({ kind = "fact", children }: { kind?: "fact" | "review"; children: React.ReactNode }) {
  return (
    <div className={cn("mt-3 rounded-2xl p-3 text-[13px] leading-relaxed", kind === "fact" ? "bg-lavender/70 text-midnight/80" : "border border-dashed border-sunset/60 bg-sunset/10 text-midnight/70")}>
      <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-midnight/45">{kind === "fact" ? "Lovioo today" : "Note for legal review"}</span>
      {children}
    </div>
  );
}
