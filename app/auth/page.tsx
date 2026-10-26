"use client";

import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { display, ui } from "@/app/fonts";
import { Logo } from "@/components/brand/Logo";
import { DealCard } from "@/components/landing/DealCard";
import { ConsentChecks, NO_CHOICES, requiredMissing, type ConsentChoices } from "@/components/legal/ConsentChecks";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { useConsent } from "@/lib/consent";
import { demoDeals, fetchDeals, type Deal } from "@/lib/data/public-deals";
import { CONSENT_VERSION } from "@/lib/site";
import { safeNext } from "@/lib/safe-redirect";
import { useLovioo } from "@/lib/store";
import { getSupabase, isAuthProviderEnabled, isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Same type system as the front page: Newsreader headings, Inter for the small print.
const h = "font-display font-medium tracking-[-0.012em]";
const field =
  "h-12 w-full border-b border-ink/15 bg-transparent pl-8 pr-4 text-[15px] text-ink outline-none transition placeholder:text-ink/35 focus:border-ink/50";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function AuthForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "signin">(params.get("mode") === "signin" ? "signin" : "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [choices, setChoices] = useState<ConsentChoices>(NO_CHOICES);
  const [triedConsent, setTriedConsent] = useState(false);
  const signIn = useLovioo((s) => s.signIn);
  const signup = mode === "signup";
  const missingConsent = signup ? requiredMissing(choices) : null;
  // Google stays visible but inactive until it's switched on in Supabase (Authentication → Providers).
  const [googleReady, setGoogleReady] = useState(true);
  useEffect(() => {
    isAuthProviderEnabled("google").then(setGoogleReady);
  }, []);
  // Desktop side panel: today's front-page deals, the same ones the home page shows.
  const [deals, setDeals] = useState<Deal[]>([]);
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) setDeals(demoDeals(4));
    else fetchDeals(sb, 4).then(setDeals);
  }, []);

  /** The required agreements are saved with the account once it exists (sign-up trigger, or syncConsent for Google). */
  const rememberChoices = () => useConsent.getState().setPending({ version: CONSENT_VERSION });
  const next = safeNext(params.get("next"));
  // New accounts answer the profile questions first, then go where they were heading (or to Swipe).
  const onboardingPath = params.get("next") ? `/onboarding?next=${encodeURIComponent(next)}` : "/onboarding";
  // Sent here from a members-only page (products and prices need an account).
  const fromLocked = params.get("next") !== null && signup;
  const switchMode = (m: "signup" | "signin") => {
    setMode(m);
    setError("");
    setNotice("");
  };

  /** Demo mode only: no backend, the "account" lives in this browser. */
  const finishDemo = (n: string, e: string) => {
    signIn({ name: n, email: e });
    const { onboarded } = useLovioo.getState();
    router.push(signup && !onboarded ? onboardingPath : next);
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password needs at least 6 characters.");
    if (missingConsent) {
      setTriedConsent(true);
      return setError(missingConsent);
    }
    setError("");
    setNotice("");
    if (signup) rememberChoices();
    const sb = getSupabase();
    if (!sb) return finishDemo(email.split("@")[0].replace(/^\w/, (c) => c.toUpperCase()), email);

    setBusy(true);
    try {
      if (signup) {
        // Name and the rest of the profile are asked next, in the questionnaire.
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: { data: { consent: { ...choices, version: CONSENT_VERSION } }, emailRedirectTo: `${window.location.origin}${onboardingPath}` },
        });
        if (error) setError(friendlyAuthError(error.message, googleReady));
        else if (!data.session) setNotice(`We sent a confirmation link to ${email}. Open it to finish creating your account.`);
        else router.push(onboardingPath);
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) setError(friendlyAuthError(error.message, googleReady));
        else router.push(next);
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (!googleReady) return;
    if (missingConsent) {
      setTriedConsent(true);
      return setError(`${missingConsent} Then continue with Google.`);
    }
    if (signup) rememberChoices();
    const sb = getSupabase();
    if (!sb) return finishDemo("Marie Santos", "marie@example.com");
    // New Google accounts finish their profile first; returning ones go back to where they were.
    const back = signup ? onboardingPath : next;
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}${back}` } });
    if (error) setError(`Google sign-in isn't available yet: ${error.message}`);
  };

  return (
    <div className={cn(display.variable, ui.variable, "lovioo-paper min-h-screen bg-white font-ui text-ink antialiased lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]")}>
      <div className="mx-auto flex min-h-screen w-full max-w-[26rem] flex-col px-4 pb-8 pt-5 lg:max-w-[28rem] lg:px-6">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Lovioo home">
            <Logo mono />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-ink/55 transition hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center py-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/40">{signup ? "Free · takes a minute" : "Good to see you"}</p>
          <h1 className={cn(h, "mt-2 text-[34px] leading-[1.35] text-ink sm:text-[42px] sm:leading-[1.43]")}>
            {signup ? (
              <>
                Join Lovioo. <em className="text-ink/55">Shop smarter.</em>
              </>
            ) : (
              <>
                Welcome <em className="text-ink/55">back.</em>
              </>
            )}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/60">
            {fromLocked
              ? "Create a free account to see prices and start swiping."
              : signup
                ? "Save the things you love, get price-drop alerts and picks made for you."
                : "Sign in to see your loves, alerts and picks."}
          </p>

          <div className="mt-7 flex gap-1 border-b border-ink/10" role="tablist" aria-label="Account">
            {(["signup", "signin"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={cn("-mb-px border-b-2 px-4 py-2.5 text-sm transition", mode === m ? "border-ink font-medium text-ink" : "border-transparent text-ink/45 hover:text-ink/70")}
              >
                {m === "signup" ? "Create account" : "Sign in"}
              </button>
            ))}
          </div>

          <button
            onClick={google}
            disabled={!googleReady}
            aria-disabled={!!missingConsent || !googleReady}
            className={cn(
              "mt-6 flex h-12 w-full items-center justify-center gap-3 border border-ink/15 text-[15px] font-medium text-ink transition hover:border-ink/40 disabled:cursor-not-allowed",
              (missingConsent || !googleReady) && "opacity-60",
            )}
          >
            <GoogleIcon /> {googleReady ? "Continue with Google" : "Google sign-in coming soon"}
          </button>

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-ink/35">
            <span className="h-px flex-1 bg-ink/10" /> or with email <span className="h-px flex-1 bg-ink/10" />
          </div>

          <form onSubmit={submit} className="space-y-3.5" noValidate>
            <label className="relative block">
              <span className="sr-only">Email address</span>
              <Mail className="pointer-events-none absolute left-0 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink/35" />
              <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" autoComplete="email" inputMode="email" />
            </label>
            <label className="relative block">
              <span className="sr-only">Password</span>
              <Lock className="pointer-events-none absolute left-0 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink/35" />
              <input
                className={cn(field, "pr-12")}
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={signup ? "Create a password" : "Password"}
                autoComplete={signup ? "new-password" : "current-password"}
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
            {signup && (
              <p className={cn("flex items-center gap-1.5 text-xs", password.length >= 6 ? "text-emerald-700" : "text-ink/45")}>
                <Check className="h-3.5 w-3.5" /> At least 6 characters
              </p>
            )}

            {signup && (
              <div className="border border-ink/10 p-4">
                <ConsentChecks
                  value={choices}
                  onChange={(c) => {
                    setChoices(c);
                    if (error && !requiredMissing(c)) setError("");
                  }}
                  showErrors={triedConsent}
                />
              </div>
            )}

            {error && (
              <p className="border border-coral/30 bg-coral/5 px-4 py-3 text-sm font-medium text-coral" role="alert">
                {error}
              </p>
            )}
            {notice && <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</p>}

            <button
              className={cn(
                "flex h-12 w-full items-center justify-center gap-2 bg-ink text-[15px] font-medium text-white transition hover:opacity-85 active:scale-[0.99]",
                missingConsent && "opacity-50",
              )}
              disabled={busy}
              aria-disabled={!!missingConsent}
            >
              {busy ? "One moment…" : signup ? "Create account" : "Sign in"} {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
            {missingConsent && !triedConsent && <p className="text-center text-[11px] text-ink/45">Tick both boxes to create your account.</p>}
          </form>

          <p className="mt-6 text-center text-sm text-ink/60">
            {signup ? "Already have an account? " : "New to Lovioo? "}
            <button
              className="inline-flex min-h-[40px] items-center px-1 font-medium text-ink underline underline-offset-4"
              onClick={() => switchMode(signup ? "signin" : "signup")}
            >
              {signup ? "Sign in" : "Create an account"}
            </button>
          </p>
          {!isSupabaseConfigured && <p className="mt-3 text-center text-[11px] text-ink/40">Demo: accounts are stored only in this browser.</p>}
        </main>

        <LegalLinks />
      </div>

      {/* Desktop: today's deals, so the prices are visible while you sign up. */}
      <aside className="relative hidden border-l border-ink/10 lg:block">
        <div className="flex h-full flex-col justify-center gap-8 px-12 py-16">
          <p className={cn(h, "text-[32px] leading-[1.5]")}>
            Your next favourite thing is <em className="text-ink/55">one sentence</em> away.
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 xl:grid-cols-4">
            {deals.map((d) => (
              <DealCard key={d.slug} deal={d} />
            ))}
          </div>
          <p className="text-[13px] text-ink/50">Today&apos;s front-page deals. Your account unlocks every price, every store.</p>
        </div>
      </aside>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}

/** Turns Supabase auth errors testers are likely to hit into plain language. */
function friendlyAuthError(message: string, googleReady = true) {
  if (/email rate limit/i.test(message))
    return `We can't send more confirmation emails right now. Please try again in a little while${googleReady ? ", or continue with Google" : ""}.`;
  if (/rate limit|too many/i.test(message)) return "Lots of people are signing up right now — please try again in a few minutes.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first — check your inbox (and spam) for the link we sent.";
  if (/invalid login credentials/i.test(message)) return "That email and password don't match. Try again or create an account.";
  if (/already registered/i.test(message)) return "There's already an account with this email — sign in instead.";
  return message;
}
