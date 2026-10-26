"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PH_PROVINCES } from "@/lib/data/ph-provinces";
import { GENDERS, MIN_AGE, ageOn, readDemoAbout, useProfileStatus, writeDemoAbout, type AboutYou } from "@/lib/profile";
import { CONTACT_EMAIL } from "@/lib/site";
import { useLovioo } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const field = "w-full rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink focus:ring-4 focus:ring-pink/10";
const label = "mb-1.5 block text-sm font-medium";

/**
 * Name + birthday (required, 18+) and optional gender, province and city. Saves to the profile when signed in to
 * Supabase, or to this device in demo mode. Used by onboarding and the Profile page.
 */
export function AboutYouForm({ submitLabel, onSaved, compact }: { submitLabel: string; onSaved?: () => void; compact?: boolean }) {
  const user = useLovioo((s) => s.user);
  const signIn = useLovioo((s) => s.signIn);
  const nameLocked = useProfileStatus((s) => s.nameLocked);
  const [about, setAbout] = useState<AboutYou>({ fullName: user?.name ?? "", birthdate: null, gender: null, city: "", province: "" });
  const [parts, setParts] = useState({ d: "", m: "", y: "" });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const thisYear = new Date().getFullYear();

  // Load what's already saved (the Google name lands in full_name at sign-up).
  useEffect(() => {
    const apply = (a: AboutYou) => {
      setAbout(a);
      if (a.birthdate) {
        const [y, m, d] = a.birthdate.split("-");
        setParts({ y, m: String(Number(m)), d: String(Number(d)) });
      }
      setLoaded(true);
    };
    const sb = getSupabase();
    if (!sb || !user?.id) {
      const local = readDemoAbout();
      return apply(local ?? { fullName: user?.name ?? "", birthdate: null, gender: null, city: "", province: "" });
    }
    sb.from("profiles")
      .select("full_name, birthdate, gender, city, province")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        apply({
          fullName: data?.full_name || user.name,
          birthdate: data?.birthdate ?? null,
          gender: data?.gender ?? null,
          city: data?.city ?? "",
          province: data?.province ?? "",
        });
      });
  }, [user?.id, user?.name]);

  const set = <K extends keyof AboutYou>(k: K, v: AboutYou[K]) => setAbout((a) => ({ ...a, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const name = about.fullName.trim();
    if (!name) return setError("Please enter your name.");
    if (!parts.d || !parts.m || !parts.y) return setError("Please enter your birthday.");
    const birthdate = `${parts.y}-${parts.m.padStart(2, "0")}-${parts.d.padStart(2, "0")}`;
    const check = new Date(`${birthdate}T00:00:00`);
    if (Number.isNaN(check.getTime()) || check.getDate() !== Number(parts.d)) return setError("That date doesn't exist — please check your birthday.");
    if (ageOn(birthdate) < MIN_AGE) return setError(`Lovioo accounts are for people ${MIN_AGE} and over.`);

    const next: AboutYou = { ...about, fullName: name, birthdate, city: about.city.trim(), province: about.province };
    setSaving(true);
    try {
      const sb = getSupabase();
      if (sb && user?.id) {
        const { error: err } = await sb
          .from("profiles")
          .update({ ...(nameLocked ? {} : { full_name: name }), birthdate, gender: next.gender, city: next.city || null, province: next.province || null })
          .eq("id", user.id);
        if (err) return setError(err.message);
        useProfileStatus.setState({ needsProfile: false });
      } else writeDemoAbout(next);
      if (user && user.name !== name) signIn({ ...user, name });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className={cn("space-y-5", !loaded && "pointer-events-none opacity-60")} noValidate>
      <label className="block">
        <span className={label}>
          Full name <span className="text-pink">*</span>
        </span>
        <input
          className={cn(field, nameLocked && "cursor-not-allowed bg-ink/[0.03] text-ink/60")}
          value={about.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          autoComplete="name"
          maxLength={80}
          placeholder="Your full name"
          readOnly={nameLocked}
          aria-readonly={nameLocked || undefined}
        />
        {nameLocked && (
          <span className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] leading-snug text-ink/55">
            <Lock className="h-3 w-3 shrink-0" aria-hidden />
            Your name has been approved by the Lovioo team, so it can&apos;t be changed here. Email
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-pink">
              {CONTACT_EMAIL}
            </a>
            if it needs correcting.
          </span>
        )}
      </label>

      <fieldset>
        <legend className={label}>
          Birthday <span className="text-pink">*</span>
        </legend>
        <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2">
          <select aria-label="Day" className={field} value={parts.d} onChange={(e) => setParts((p) => ({ ...p, d: e.target.value }))}>
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <select aria-label="Month" className={field} value={parts.m} onChange={(e) => setParts((p) => ({ ...p, m: e.target.value }))}>
            <option value="">Month</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select aria-label="Year" className={field} value={parts.y} onChange={(e) => setParts((p) => ({ ...p, y: e.target.value }))}>
            <option value="">Year</option>
            {Array.from({ length: thisYear - MIN_AGE - 1900 + 1 }, (_, i) => thisYear - MIN_AGE - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1.5 text-[11px] text-ink/45">
          Lovioo is for adults {MIN_AGE}+. We only use your birthday to confirm that, and it&apos;s never shown to anyone.
        </p>
      </fieldset>

      <fieldset>
        <legend className={label}>
          Gender <span className="font-normal text-ink/40">(optional)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={about.gender === g.id}
              onClick={() => set("gender", about.gender === g.id ? null : g.id)}
              className={cn("chip", about.gender === g.id && "chip-active")}
            >
              {g.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className={cn("grid gap-3", !compact && "sm:grid-cols-2")}>
        <label className="block">
          <span className={label}>
            Province <span className="font-normal text-ink/40">(optional)</span>
          </span>
          <select className={field} value={about.province} onChange={(e) => set("province", e.target.value)}>
            <option value="">Choose your province</option>
            {PH_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>
            City / municipality <span className="font-normal text-ink/40">(optional)</span>
          </span>
          <input className={field} value={about.city} onChange={(e) => set("city", e.target.value)} maxLength={80} placeholder="e.g. Quezon City" autoComplete="address-level2" />
        </label>
      </div>
      <p className="text-[11px] text-ink/45">
        Gender and location help us pick styles and deals that suit you. See our <Link href="/privacy#collect" className="font-semibold text-pink">Privacy Policy</Link>.
      </p>

      {error && (
        <p role="alert" className="rounded-2xl bg-coral/10 p-3 text-sm font-medium text-coral">
          {error}
        </p>
      )}
      <button className="btn-primary w-full !py-3" disabled={saving}>
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
