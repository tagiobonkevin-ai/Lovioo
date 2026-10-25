"use client";

import { ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { adminDb, saveWith, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Panel, Skeleton, adminInput } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export default function AdminSettings() {
  const { data, error, loading, reload } = useAdminQuery((sb) => sb.from("admins").select("*").order("added_at"));
  const [email, setEmail] = useState("");
  const [me, setMe] = useState("");

  useEffect(() => {
    adminDb()
      .auth.getUser()
      .then(({ data }) => setMe(data.user?.email?.toLowerCase() ?? ""));
  }, []);

  const add = async () => {
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) return;
    if (await saveWith(adminDb().from("admins").insert({ email: e }), `${e} is now an admin`)) {
      setEmail("");
      reload();
    }
  };

  const remove = async (e: string) => {
    const self = e === me;
    if (!window.confirm(self ? "Remove yourself? You'll lose access to this admin right away." : `Remove ${e} from admins?`)) return;
    if (await saveWith(adminDb().from("admins").delete().eq("email", e), `${e} removed`)) {
      if (self) window.location.href = "/discover";
      else reload();
    }
  };

  return (
    <div>
      <PageHeader title="Admins" sub="People who can open Lovioo Business and edit the catalog." />
      <Panel className="max-w-2xl">
        {error && <ErrorNote message={error} />}
        {loading && !data && <Skeleton className="h-32" />}
        {data && (
          <ul className="divide-y divide-line/70">
            {data.map((a) => (
              <li key={a.email} className="flex items-center gap-3 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-pink/10 text-pink">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm">
                  <span className="font-semibold">{a.email}</span>
                  {a.email === me && <span className="ml-2 rounded-full bg-lavender px-2 py-0.5 text-[10px] font-semibold">You</span>}
                  <span className="block text-xs text-midnight/50">Added {new Date(a.added_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</span>
                </span>
                <button
                  onClick={() => remove(a.email)}
                  disabled={data.length === 1}
                  title={data.length === 1 ? "There must be at least one admin" : "Remove"}
                  className="grid h-8 w-8 place-items-center rounded-full text-midnight/40 hover:text-coral disabled:opacity-30"
                  aria-label={`Remove ${a.email}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex gap-2 border-t border-line/70 pt-4">
          <input className={cn(adminInput, "flex-1")} type="email" placeholder="teammate@company.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Admin email" />
          <button onClick={add} className="btn-primary !py-2" disabled={!/^\S+@\S+\.\S+$/.test(email.trim())}>
            Add admin
          </button>
        </div>
        <p className="mt-3 text-[11px] text-midnight/40">They sign in with this email on the normal Lovioo sign-in page. Their email must be confirmed before admin access works.</p>
      </Panel>
    </div>
  );
}
