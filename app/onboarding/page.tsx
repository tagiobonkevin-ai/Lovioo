"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useHydrated } from "@/components/Providers";
import { Logo } from "@/components/brand/Logo";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { RetailerBadge } from "@/components/product/RetailerBadge";
import { BUDGETS, browseCategories } from "@/lib/data/categories";
import { PH_PROVINCES } from "@/lib/data/ph-provinces";
import { ALL_RETAILERS, retailerById } from "@/lib/data/retailers";
import { GENDERS, MIN_AGE, ageOn, readDemoAbout, useProfileStatus, writeDemoAbout, type AboutYou } from "@/lib/profile";
import { safeNext } from "@/lib/safe-redirect";
import { useLovioo } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import type { Gender } from "@/lib/supabase/database.types";
import type { CategoryId, Preferences, RetailerId } from "@/lib/types";
import { CategoryCard } from "@/components/product/CategoryCard";
import { categoryHasProducts } from "@/lib/data/products";
import { cn } from "@/lib/utils";

type StepId = "name" | "birthday" | "gender" | "place" | "interests" | "budget" | "stores";

const ABOUT_STEPS: StepId[] = ["name", "birthday", "gender", "place"];
const PREF_STEPS: StepId[] = ["interests", "budget", "stores"];
const REQUIRED: StepId[] = ["name", "birthday"];

const COPY: Record<StepId, { emoji: string; title: React.ReactNode; hint: string }> = {
  name: { emoji: "👋", title: <>First, what should we <em className="text-pink">call you?</em></>, hint: "This is the name you'll see on Lovioo." },
  birthday: { emoji: "🎂", title: <>When&apos;s your <em className="text-pink">birthday?</em></>, hint: `Lovioo is for adults ${MIN_AGE}+. We only use it to confirm that — it's never shown to anyone.` },
  gender: { emoji: "✨", title: <>How do you <em className="text-pink">identify?</em></>, hint: "Helps us pick styles that suit you. Optional." },
  place: { emoji: "📍", title: <>Where do you <em className="text-pink">shop from?</em></>, hint: "For deals and delivery info near you. Optional." },
  interests: { emoji: "💘", title: <>What are you <em className="text-pink">into?</em></>, hint: "Pick as many as you like — your swipe deck learns from these." },
  budget: { emoji: "💸", title: <>What&apos;s your usual <em className="text-pink">budget?</em></>, hint: "We'll lead with deals in your range." },
  stores: { emoji: "🛍️", title: <>Where do you like to <em className="text-pink">shop?</em></>, hint: "We'll highlight offers from these stores." },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const h = "font-display font-normal tracking-[-0.01em]";
const pill = "h-14 w-full rounded-2xl bg-white px-4 text-base text-ink outline-none ring-1 ring-midnight/10 transition focus:ring-2 focus:ring-pink/50";

/** One question per screen: name and birthday are required for accounts; everything else can be skipped. */
export default function Onboarding() {
  const router = useRouter();
  const { setPrefs, completeOnboarding, user, signIn } = useLovioo();
  const hydrated = useHydrated();
  const needsProfile = useProfileStatus((s) => s.needsProfile);
  const [aboutPending, setAboutPending] = useState<boolean | null>(null);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [bday, setBday] = useState({ d: "", m: "", y: "" });
  const [gender, setGender] = useState<Gender | null>(null);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState<CategoryId[]>([]);
  const [budget, setBudget] = useState<Preferences["budget"]>(null);
  const [platforms, setPlatforms] = useState<RetailerId[]>(["shopee", "lazada", "tiktok", "amazon"]);

  // Accounts that haven't given a name + birthday start with "about you"; everyone else goes straight to preferences.
  useEffect(() => {
    if (!hydrated) return;
    const sb = getSupabase();
    const prefill = (a: Partial<AboutYou> & { email?: string }) => {
      // Sign-up stores the email's first part as a placeholder name: don't offer it back.
      const local = (a.email ?? user?.email ?? "").split("@")[0];
      if (a.fullName && a.fullName !== local) setName(a.fullName);
      if (a.birthdate) {
        const [y, m, d] = a.birthdate.split("-");
        setBday({ y, m: String(Number(m)), d: String(Number(d)) });
      }
      if (a.gender) setGender(a.gender);
      if (a.province) setProvince(a.province);
      if (a.city) setCity(a.city);
    };
    if (!user) return setAboutPending(false);
    if (!sb || !user.id) {
      const local = readDemoAbout();
      if (local) prefill(local);
      else prefill({ fullName: user.name });
      return setAboutPending(!local);
    }
    sb.from("profiles")
      .select("full_name, email, birthdate, gender, city, province, profile_completed_at")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        prefill({ fullName: data?.full_name, email: data?.email ?? undefined, birthdate: data?.birthdate, gender: data?.gender, city: data?.city ?? "", province: data?.province ?? "" });
        setAboutPending(!data?.profile_completed_at);
      });
  }, [hydrated, user]);
  useEffect(() => {
    if (needsProfile) setAboutPending(true);
  }, [needsProfile]);
  // A fixed answer clears the old message.
  useEffect(() => setError(""), [name, bday, gender, province, city]);

  const steps = useMemo(() => (aboutPending ? [...ABOUT_STEPS, ...PREF_STEPS] : PREF_STEPS), [aboutPending]);
  const id = steps[step];
  const required = REQUIRED.includes(id);
  const last = step === steps.length - 1;

  const finish = (savePrefs: boolean) => {
    if (savePrefs) setPrefs({ interests, budget, platforms });
    completeOnboarding();
    // Where they were heading before signing up, otherwise straight into Swipe.
    router.push(safeNext(new URLSearchParams(window.location.search).get("next"), "/swipe"));
  };

  /** Saves the "about you" answers as they're given, so leaving halfway keeps what was entered. */
  const saveAbout = async (patch: Partial<{ full_name: string; birthdate: string; gender: Gender | null; city: string | null; province: string | null }>) => {
    const sb = getSupabase();
    if (sb && user?.id) {
      const { error: err } = await sb.from("profiles").update(patch).eq("id", user.id);
      if (err) return err.message;
      if (patch.birthdate) useProfileStatus.setState({ needsProfile: false });
    } else {
      const prev = readDemoAbout() ?? { fullName: user?.name ?? "", birthdate: null, gender: null, city: "", province: "" };
      writeDemoAbout({
        fullName: patch.full_name ?? prev.fullName,
        birthdate: patch.birthdate ?? prev.birthdate,
        gender: patch.gender !== undefined ? patch.gender : prev.gender,
        city: patch.city ?? prev.city,
        province: patch.province ?? prev.province,
      });
    }
    if (patch.full_name && user && user.name !== patch.full_name) signIn({ ...user, name: patch.full_name });
    return null;
  };

  const birthdate = () => (bday.d && bday.m && bday.y ? `${bday.y}-${bday.m.padStart(2, "0")}-${bday.d.padStart(2, "0")}` : null);
  const validate = (): string | null => {
    if (id === "name" && !name.trim()) return "Please tell us your name.";
    if (id === "birthday") {
      const b = birthdate();
      if (!b) return "Please choose your day, month and year.";
      if (new Date(`${b}T00:00:00`).getDate() !== Number(bday.d)) return "That date doesn't exist — please check it.";
      if (ageOn(b) < MIN_AGE) return `Lovioo accounts are for people ${MIN_AGE} and over.`;
    }
    return null;
  };

  const go = (delta: number) => {
    setError("");
    setDir(delta);
    setStep((s) => Math.min(Math.max(s + delta, 0), steps.length - 1));
  };

  const advance = async (skip = false) => {
    if (!skip) {
      const problem = validate();
      if (problem) return setError(problem);
    }
    if (ABOUT_STEPS.includes(id) && !skip) {
      setSaving(true);
      const err = await saveAbout(
        id === "name"
          ? { full_name: name.trim() }
          : id === "birthday"
            ? { full_name: name.trim(), birthdate: birthdate()! }
            : id === "gender"
              ? { gender }
              : { province: province || null, city: city.trim() || null },
      );
      setSaving(false);
      if (err) return setError(err);
    }
    if (last) return finish(true);
    go(1);
  };

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const thisYear = new Date().getFullYear();
  // Guests and finished profiles only see the (optional) preference questions.
  const optionalOnly = aboutPending === false;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-ink">
      <header className="mx-auto flex w-full max-w-xl items-center gap-3 px-5 pt-5">
        {step > 0 ? (
          <button onClick={() => go(-1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white ring-1 ring-midnight/10" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <Logo />
        )}
        <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1} aria-label="Questions">
          {aboutPending !== null &&
            steps.map((s, i) => <span key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", i <= step ? "bg-pink" : "bg-midnight/10")} />)}
        </div>
        {aboutPending !== null &&
          (required ? (
            <span className="w-12 text-right text-xs text-ink/40">
              {step + 1}/{steps.length}
            </span>
          ) : (
            <button
              onClick={() => (optionalOnly && step === 0 ? finish(false) : last ? finish(true) : advance(true))}
              className="rounded-full px-3 py-2 text-sm font-medium text-ink/55 hover:text-ink"
            >
              Skip
            </button>
          ))}
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-4">
        {aboutPending === null ? (
          <div className="mt-16 h-48 animate-pulse rounded-3xl bg-white/70" />
        ) : (
          <AnimatePresence mode="wait" custom={dir}>
            <motion.section
              key={id}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.22 }}
              className="flex flex-1 flex-col pt-10 sm:pt-16"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-3xl shadow-soft" aria-hidden>
                {COPY[id].emoji}
              </span>
              <h1 className={cn(h, "mt-5 text-[2.4rem] leading-[1.05] sm:text-5xl")}>{COPY[id].title}</h1>
              <p className="mt-2 text-[15px] text-ink/55">{COPY[id].hint}</p>

              <div className="mt-8 flex-1">
                {id === "name" && (
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && advance()}
                    maxLength={80}
                    autoComplete="name"
                    placeholder="Your name"
                    aria-label="Your name"
                    className="w-full border-b-2 border-midnight/15 bg-transparent pb-3 text-3xl outline-none transition placeholder:text-ink/25 focus:border-pink"
                  />
                )}

                {id === "birthday" && (
                  <div className="grid grid-cols-[1fr_1.2fr_1.3fr] gap-2.5">
                    <select aria-label="Day" className={pill} value={bday.d} onChange={(e) => setBday((b) => ({ ...b, d: e.target.value }))}>
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                    <select aria-label="Month" className={pill} value={bday.m} onChange={(e) => setBday((b) => ({ ...b, m: e.target.value }))}>
                      <option value="">Month</option>
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select aria-label="Year" className={pill} value={bday.y} onChange={(e) => setBday((b) => ({ ...b, y: e.target.value }))}>
                      <option value="">Year</option>
                      {Array.from({ length: thisYear - MIN_AGE - 1900 + 1 }, (_, i) => thisYear - MIN_AGE - i).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {id === "gender" && (
                  <div className="grid gap-2.5">
                    {GENDERS.map((g) => (
                      <Choice key={g.id} on={gender === g.id} onClick={() => setGender(gender === g.id ? null : g.id)}>
                        {g.label}
                      </Choice>
                    ))}
                  </div>
                )}

                {id === "place" && (
                  <div className="grid gap-3">
                    <select aria-label="Province" className={pill} value={province} onChange={(e) => setProvince(e.target.value)}>
                      <option value="">Choose your province</option>
                      {PH_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <input
                      aria-label="City or municipality"
                      className={pill}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      maxLength={80}
                      placeholder="City or municipality (e.g. Quezon City)"
                      autoComplete="address-level2"
                    />
                  </div>
                )}

                {id === "interests" && (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {browseCategories(categoryHasProducts).map((c) => {
                      const on = interests.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => setInterests(toggle(interests, c.id))}
                          aria-pressed={on}
                          className={cn(
                            "group relative rounded-xl text-left transition active:scale-[0.98]",
                            on ? "ring-2 ring-pink ring-offset-2" : "opacity-95 hover:opacity-100",
                          )}
                        >
                          <CategoryCard category={c} className="h-[168px] w-full" />
                          {on && (
                            <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-pink text-white shadow-pop">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {id === "budget" && (
                  <div className="grid gap-2.5">
                    {BUDGETS.map((b) => (
                      <Choice key={b.id} on={budget === b.id} onClick={() => setBudget(budget === b.id ? null : b.id)}>
                        {b.label}
                      </Choice>
                    ))}
                  </div>
                )}

                {id === "stores" && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {ALL_RETAILERS.map((r) => {
                      const on = platforms.includes(r);
                      return (
                        <button
                          key={r}
                          onClick={() => setPlatforms(toggle(platforms, r))}
                          aria-pressed={on}
                          className={cn(
                            "relative flex items-center gap-3 rounded-2xl p-3.5 pr-7 text-left text-sm font-semibold leading-tight transition active:scale-[0.98]",
                            on ? "bg-pink/[0.06] ring-2 ring-pink" : "bg-white ring-1 ring-midnight/10 hover:ring-midnight/25",
                          )}
                        >
                          <RetailerBadge id={r} size="md" />
                          <span className="min-w-0 truncate">{retailerById(r).name}</span>
                          {on && <Check className="absolute right-2.5 top-2.5 h-4 w-4 text-pink" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {error && (
                <p role="alert" className="mt-4 rounded-2xl bg-coral/10 px-4 py-3 text-sm font-medium text-coral">
                  {error}
                </p>
              )}

              <div className="sticky bottom-0 -mx-5 mt-6 bg-gradient-to-t from-[#FBF7F2] via-[#FBF7F2] to-transparent px-5 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-4">
                <button
                  onClick={() => advance()}
                  disabled={saving}
                  className={cn(
                    "flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-semibold text-white transition active:scale-[0.99]",
                    last ? "bg-brand shadow-pop" : "bg-midnight hover:bg-midnight/90",
                  )}
                >
                  {saving ? "Saving…" : last ? "Start swiping 💘" : "Continue"} {!saving && !last && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </motion.section>
          </AnimatePresence>
        )}
      </main>
      <LegalLinks className="pb-5" />
    </div>
  );
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "flex h-14 items-center justify-between rounded-2xl px-5 text-left text-base font-semibold transition active:scale-[0.99]",
        on ? "bg-pink/[0.06] ring-2 ring-pink" : "bg-white ring-1 ring-midnight/10 hover:ring-midnight/25",
      )}
    >
      {children}
      <span className={cn("grid h-6 w-6 place-items-center rounded-full border-2 transition", on ? "border-pink bg-pink text-white" : "border-midnight/15")}>
        {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}
