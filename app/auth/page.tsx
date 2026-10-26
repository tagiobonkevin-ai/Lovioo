"use client";

import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ConsentChecks, NO_CHOICES, requiredMissing, type ConsentChoices } from "@/components/legal/ConsentChecks";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { useConsent } from "@/lib/consent";
import { CONSENT_VERSION } from "@/lib/site";
import { safeNext } from "@/lib/safe-redirect";
import { useLovioo } from "@/lib/store";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const PERKS = ["Discover better deals", "Compare across stores", "Save your favourites", "Get personalised picks"];

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [choices, setChoices] = useState<ConsentChoices>(NO_CHOICES);
  const [triedConsent, setTriedConsent] = useState(false);
  const signIn = useLovioo((s) => s.signIn);
  const missingConsent = mode === "signup" ? requiredMissing(choices) : null;

  /** Sign-up choices: applied on this device now, and saved to the account once it exists (see syncConsent). */
  const rememberChoices = () => {
    useConsent.getState().setChoices({ analytics: choices.analytics, marketing: choices.marketing });
    useConsent.getState().setPending({ marketing: choices.marketing, analytics: choices.analytics, version: CONSENT_VERSION });
  };
  const next = safeNext(params.get("next"));

  /** Demo mode only: no backend, the "account" lives in this browser. */
  const finishDemo = (n: string, e: string) => {
    signIn({ name: n, email: e });
    const { onboarded } = useLovioo.getState();
    router.push(mode === "signup" && !onboarded ? "/onboarding" : next);
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
    if (mode === "signup") rememberChoices();
    const sb = getSupabase();
    if (!sb) return finishDemo(name.trim() || email.split("@")[0].replace(/^\w/, (c) => c.toUpperCase()), email);

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() || email.split("@")[0], consent: { ...choices, version: CONSENT_VERSION } },
            emailRedirectTo: `${window.location.origin}/onboarding`,
          },
        });
        if (error) setError(friendlyAuthError(error.message));
        else if (!data.session) setNotice(`We sent a confirmation link to ${email}. Open it to finish creating your account.`);
        else router.push("/onboarding");
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) setError(friendlyAuthError(error.message));
        else router.push(next);
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (missingConsent) {
      setTriedConsent(true);
      return setError(`${missingConsent} Then continue with Google.`);
    }
    if (mode === "signup") rememberChoices();
    const sb = getSupabase();
    if (!sb) return finishDemo("Marie Santos", "marie@example.com");
    // New Google accounts finish their profile first; returning ones go back to where they were.
    const back = mode === "signup" ? `/onboarding?next=${encodeURIComponent(next)}` : next;
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}${back}` } });
    if (error) setError(`Google sign-in isn't available yet: ${error.message}`);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-soft p-12 lg:flex lg:flex-col">
        <Link href="/">
          <Logo tagline />
        </Link>
        <h1 className="mt-16 text-5xl font-extrabold leading-tight tracking-tight">
          Join Lovioo <br /> today
        </h1>
        <ul className="mt-8 space-y-3">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-3 text-midnight/80">
              <CheckCircle2 className="h-5 w-5 text-pink" /> {p}
            </li>
          ))}
        </ul>
        <div className="pointer-events-none absolute -bottom-10 -right-10 text-[16rem] leading-none opacity-90">🛍️</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden">
            <Logo tagline />
          </Link>
          <div className="mt-8 flex rounded-full bg-white p-1 ring-1 ring-line lg:mt-0">
            {(["signup", "signin"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={cn("flex-1 rounded-full py-2.5 text-sm font-semibold transition", mode === m ? "bg-pink text-white shadow-pop" : "text-midnight/60")}
              >
                {m === "signup" ? "Sign up" : "Sign in"}
              </button>
            ))}
          </div>

          <h2 className="mt-8 text-center text-2xl font-extrabold">{mode === "signup" ? "Welcome to Lovioo 💗" : "Welcome back"}</h2>
          <p className="mt-1 text-center text-sm text-midnight/60">{mode === "signup" ? "Discover products. Find deals. Shop smarter." : "Sign in to continue to Lovioo."}</p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {mode === "signup" && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">
                  Your name <span className="font-normal text-midnight/40">(optional)</span>
                </span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Email address</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Password</span>
              <span className="relative block">
                <input
                  className="input pr-12"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Create a secure password" : "Your password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight/40" aria-label={show ? "Hide password" : "Show password"}>
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </span>
            </label>
            {mode === "signup" && (
              <>
                <hr className="!my-5 border-line" />
                <ConsentChecks
                  value={choices}
                  onChange={(c) => {
                    setChoices(c);
                    if (error && !requiredMissing(c)) setError("");
                  }}
                  showErrors={triedConsent}
                />
              </>
            )}
            {error && (
              <p className="text-sm font-medium text-coral" role="alert">
                {error}
              </p>
            )}
            {notice && <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{notice}</p>}
            <button className={cn("btn-primary w-full !py-3", missingConsent && "opacity-60 saturate-50")} disabled={busy} aria-disabled={!!missingConsent}>
              {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
            {missingConsent && !triedConsent && <p className="text-center text-[11px] text-midnight/45">Tick both required boxes to create your account.</p>}
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-midnight/40">
            <span className="h-px flex-1 bg-line" /> or continue with <span className="h-px flex-1 bg-line" />
          </div>
          <button onClick={google} className={cn("btn-ghost w-full !py-3", missingConsent && "opacity-60")} aria-disabled={!!missingConsent}>
            <GoogleIcon /> Continue with Google
          </button>
          <p className="mt-6 text-center text-sm text-midnight/60">
            {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
            <button className="font-semibold text-pink" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
              {mode === "signup" ? "Sign in" : "Sign up"}
            </button>
          </p>
          {!isSupabaseConfigured && <p className="mt-4 text-center text-[11px] text-midnight/40">Demo: accounts are stored only in this browser.</p>}
          <LegalLinks className="mt-8" />
        </div>
      </div>
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
function friendlyAuthError(message: string) {
  if (/email rate limit/i.test(message)) return "We can't send more confirmation emails right now. Please try again later, or continue with Google.";
  if (/rate limit|too many/i.test(message)) return "Lots of people are signing up right now — please try again in a few minutes.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first — check your inbox (and spam) for the link we sent.";
  if (/invalid login credentials/i.test(message)) return "That email and password don't match. Try again or create an account.";
  if (/already registered/i.test(message)) return "There's already an account with this email — sign in instead.";
  return message;
}
