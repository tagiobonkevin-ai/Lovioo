"use client";

import { ArrowRight, Check, Eye, EyeOff, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const field =
  "h-12 w-full border-0 border-b border-ink/15 bg-transparent pl-7 text-[15px] text-ink outline-none transition placeholder:text-ink/35 focus:border-ink/50";

/**
 * Where the reset email lands. Supabase puts a one-time code in the URL and supabase-js exchanges it for a
 * short-lived session, which is what lets updateUser set a new password. That exchange only works in the
 * browser that asked for the link, so the page says so plainly when it fails instead of looking broken.
 */
export default function NewPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "ok" | "expired">("checking");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return setReady("expired");
    // supabase-js handles the code in the URL on load; a recovery session is the proof it worked.
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady("ok");
    });
    sb.auth.getSession().then(({ data }) => setReady(data.session ? "ok" : "expired"));
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (password.length < 6) return setError("Password needs at least 6 characters.");
    if (password !== again) return setError("The two passwords don't match.");
    const sb = getSupabase();
    if (!sb) return setError("Password reset needs the live site.");
    setError("");
    setBusy(true);
    try {
      const { error } = await sb.auth.updateUser({ password });
      if (error) setError(resetError(error.message));
      else router.push("/discover");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("lovioo-paper min-h-screen bg-white font-ui text-ink antialiased")}>
      <div className="mx-auto flex min-h-screen w-full max-w-[26rem] flex-col px-4 pb-8 pt-5 lg:max-w-[28rem] lg:px-6">
        <header>
          <Link href="/" aria-label="Lovioo home">
            <Logo />
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center py-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/40">Password help</p>
          <h1 className="mt-2 font-display text-[34px] font-medium leading-[1.35] tracking-[-0.012em] text-ink sm:text-[42px] sm:leading-[1.43]">
            Choose a new <em className="text-ink/55">password.</em>
          </h1>

          {ready === "checking" && (
            <p className="mt-6 text-[15px] leading-relaxed text-ink/60" role="status">
              Checking your link…
            </p>
          )}

          {ready === "expired" && (
            <>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/60">
                This link can&apos;t be used. Reset links last an hour and only work in the same browser you asked from —
                so if you asked on your laptop, open the email there too.
              </p>
              <Link
                href="/auth?mode=signin"
                className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-pink px-6 text-[15px] font-bold text-white shadow-pop transition hover:brightness-105"
              >
                Ask for a new link <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}

          {ready === "ok" && (
            <>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/60">Pick something you&apos;ll remember. You&apos;ll be signed in straight after.</p>
              <form onSubmit={submit} className="mt-7 space-y-3.5" noValidate>
                <label className="relative block">
                  <span className="sr-only">New password</span>
                  <Lock className="pointer-events-none absolute left-0 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink/35" />
                  <input
                    className={cn(field, "pr-12")}
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-0 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-ink/40 hover:text-ink"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </label>
                <label className="relative block">
                  <span className="sr-only">Repeat new password</span>
                  <Lock className="pointer-events-none absolute left-0 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink/35" />
                  <input
                    className={field}
                    type={show ? "text" : "password"}
                    value={again}
                    onChange={(e) => setAgain(e.target.value)}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                </label>
                <p className={cn("flex items-center gap-1.5 text-xs", password.length >= 6 ? "text-emerald-700" : "text-ink/45")}>
                  <Check className="h-3.5 w-3.5" /> At least 6 characters
                </p>

                {error && (
                  <p className="border border-coral/30 bg-coral/5 px-4 py-3 text-sm font-medium text-coral" role="alert">
                    {error}
                  </p>
                )}

                <button
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-pink text-[15px] font-bold text-white shadow-pop transition hover:brightness-105 active:scale-[0.99]"
                  disabled={busy}
                >
                  {busy ? "One moment…" : "Save new password"} {!busy && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            </>
          )}

          <LegalLinks className="mt-10" />
        </main>
      </div>
    </div>
  );
}

function resetError(message: string) {
  if (/same password/i.test(message)) return "That's the password you already have. Choose a different one.";
  if (/weak password|password should be/i.test(message)) return "Pick a longer password — at least 6 characters.";
  if (/expired|invalid/i.test(message)) return "This link has expired. Ask for a new one from the sign-in page.";
  return message;
}
