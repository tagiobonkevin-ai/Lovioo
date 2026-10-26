import { cn } from "@/lib/utils";

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] leading-[1.4] sm:text-[32px] sm:leading-[1.4]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink/55">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-ink/10 bg-white p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[18px] leading-[1.5]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return <p className="rounded-2xl bg-coral/10 p-4 text-sm font-medium text-coral">Couldn&apos;t load data: {message}</p>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-ink/[0.04]", className)} />;
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition", on ? "bg-pink" : "bg-ink/15")}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink/45">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink/40">{hint}</span>}
    </label>
  );
}

export const adminInput = "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-ink/50";
