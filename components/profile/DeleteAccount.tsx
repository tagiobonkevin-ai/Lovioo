"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/Providers";
import { useLovioo } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** What goes when an account closes, in the order a shopper would think of it. */
const GOES = ["your sign-in", "your profile and answers", "everything you saved", "your price alerts", "your swipe history", "your privacy choices"];

/**
 * Closing your own account, from inside the app. Typing your own email address is the confirmation — the
 * same shape the admin's delete uses — and the database checks it again, so a mistyped address can't wipe
 * anyone. This cannot be undone, so the sheet says so before the button appears.
 */
export function DeleteAccount() {
  const router = useRouter();
  const { user, signOut } = useLovioo();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const email = user?.email ?? "";
  const matches = typed.trim().toLowerCase() === email.toLowerCase() && !!email;

  const run = async () => {
    const sb = getSupabase();
    if (!sb) {
      toast({ title: "Not available here", body: "Closing an account needs the live site.", kind: "error" });
      return;
    }
    setBusy(true);
    const { error } = await sb.rpc("delete_my_account", { confirm_email: typed.trim() });
    setBusy(false);
    if (error) {
      toast({ title: "Couldn't close your account", body: error.message, kind: "error" });
      return;
    }
    await sb.auth.signOut();
    signOut();
    router.push("/");
  };

  if (!open)
    return (
      <section className="card p-6">
        <h2 className="font-bold">Close your account</h2>
        <p className="mt-1 text-sm text-ink/60">
          Delete your Lovioo account and everything in it, for good. You can also email us and we&apos;ll do it for you.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-coral/40 px-4 py-2 text-sm font-medium text-coral transition hover:border-coral hover:bg-coral/5"
        >
          <Trash2 className="h-4 w-4" /> Delete my account
        </button>
      </section>
    );

  return (
    <section className="card border-coral/30 p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-coral/10 text-coral">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold">Delete your account for good?</h2>
          <p className="mt-1 text-sm text-ink/60">This can&apos;t be undone. These all go with it:</p>
        </div>
      </div>

      <ul className="mt-3 grid gap-1 text-sm text-ink/70 sm:grid-cols-2">
        {GOES.map((g) => (
          <li key={g} className="flex gap-2">
            <span aria-hidden>·</span> {g}
          </li>
        ))}
      </ul>

      <label className="mt-5 block">
        <span className="text-sm font-medium">
          Type <span className="font-mono text-ink">{email}</span> to confirm
        </span>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={email}
          autoComplete="off"
          spellCheck={false}
          aria-label="Type your email address to confirm"
          className="mt-2 h-12 w-full border-0 border-b border-ink/15 bg-transparent text-[15px] text-ink outline-none transition placeholder:text-ink/30 focus:border-coral"
        />
      </label>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={run}
          disabled={!matches || busy}
          className={cn(
            "inline-flex h-11 items-center gap-2 bg-coral px-5 text-sm font-medium text-white transition",
            matches && !busy ? "hover:opacity-85" : "cursor-not-allowed opacity-40",
          )}
        >
          <Trash2 className="h-4 w-4" /> {busy ? "Closing…" : "Delete everything"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
          className="inline-flex h-11 items-center border border-ink/20 px-5 text-sm font-medium text-ink/70 transition hover:border-ink/50 hover:text-ink"
        >
          Keep my account
        </button>
      </div>
    </section>
  );
}
