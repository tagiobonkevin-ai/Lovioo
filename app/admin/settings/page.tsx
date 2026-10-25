"use client";

import { History, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { ROLE_LABELS, useAdminRole } from "@/components/admin/AdminShell";
import { adminDb, saveWith, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Panel, Skeleton, adminInput } from "@/components/admin/ui";
import type { AppRole } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

const ROLES: AppRole[] = ["customer", "editor", "admin", "super_admin"];

const ROLE_HELP: Record<AppRole, string> = {
  customer: "Shops on Lovioo. No access to Lovioo Business.",
  editor: "Adds and edits products and offers as drafts. Can't publish or delete.",
  admin: "Runs the catalog, stores, categories, feedback and analytics. Can't change roles.",
  super_admin: "Everything, including changing roles. There must always be at least one.",
};

const fmt = (d: string) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

export default function TeamAndRoles() {
  const myRole = useAdminRole();
  const canChange = myRole === "super_admin";
  const team = useAdminQuery((sb) => sb.rpc("list_team"));
  const log = useAdminQuery((sb) => sb.from("role_changes").select("*").order("created_at", { ascending: false }).limit(50));
  const [me, setMe] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    adminDb()
      .auth.getUser()
      .then(({ data }) => setMe(data.user?.id ?? ""));
  }, []);

  const change = async (id: string, email: string, role: AppRole) => {
    if (!window.confirm(`Make ${email} ${ROLE_LABELS[role].toLowerCase()}?`)) return;
    if (await saveWith(adminDb().rpc("set_user_role", { target: id, new_role: role }), `${email} is now ${ROLE_LABELS[role].toLowerCase()}`)) {
      team.reload();
      log.reload();
    }
  };

  const people = (team.data ?? []).filter((p) => !q || `${p.email} ${p.full_name}`.toLowerCase().includes(q.toLowerCase()));
  const staff = people.filter((p) => p.role !== "customer");
  const customers = people.filter((p) => p.role === "customer");

  return (
    <div>
      <PageHeader
        title="Team & roles"
        sub={canChange ? "Choose who can open Lovioo Business and what they can do." : "Only a super admin can change roles. You can see who has access."}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel>
          {team.error && <ErrorNote message={team.error} />}
          {team.loading && !team.data && <Skeleton className="h-40" />}
          {team.data && (
            <>
              <input className={cn(adminInput, "mb-3")} placeholder="Search people by email or name…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search people" />
              {[
                { title: "Staff", rows: staff },
                { title: "Customers", rows: customers },
              ].map(
                (group) =>
                  group.rows.length > 0 && (
                    <div key={group.title} className="mb-4">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-midnight/50">
                        {group.title} · {group.rows.length}
                      </p>
                      <ul className="divide-y divide-line/70">
                        {group.rows.map((p) => (
                          <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                            <span className={cn("grid h-9 w-9 place-items-center rounded-full", p.role === "customer" ? "bg-line text-midnight/50" : "bg-pink/10 text-pink")}>
                              <ShieldCheck className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1 text-sm">
                              <span className="block truncate font-semibold">
                                {p.email}
                                {p.id === me && <span className="ml-2 rounded-full bg-lavender px-2 py-0.5 text-[10px] font-semibold">You</span>}
                              </span>
                              <span className="block text-xs text-midnight/50">
                                {p.full_name} · joined {fmt(p.created_at)}
                                {!p.email_confirmed && <span className="ml-1 text-coral">· email not confirmed (role inactive until it is)</span>}
                              </span>
                            </span>
                            {canChange ? (
                              <select
                                className={cn(adminInput, "!w-auto")}
                                value={p.role}
                                onChange={(e) => change(p.id, p.email, e.target.value as AppRole)}
                                aria-label={`Role for ${p.email}`}
                              >
                                {ROLES.map((r) => (
                                  <option key={r} value={r}>
                                    {ROLE_LABELS[r]}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="rounded-full bg-lavender px-2.5 py-1 text-xs font-semibold">{ROLE_LABELS[p.role]}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
              )}
              {people.length === 0 && <p className="py-6 text-center text-sm text-midnight/50">No one matches.</p>}
              <p className="mt-2 text-[11px] text-midnight/40">
                To add someone, ask them to create a Lovioo account and confirm their email, then give them a role here. Lovioo always keeps at least one super admin.
              </p>
            </>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="What each role can do">
            <ul className="space-y-3 text-sm">
              {ROLES.map((r) => (
                <li key={r}>
                  <span className="font-semibold">{ROLE_LABELS[r]}</span>
                  <span className="block text-xs text-midnight/60">{ROLE_HELP[r]}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Role changes" action={<History className="h-4 w-4 text-midnight/40" />}>
            {log.error && <ErrorNote message={log.error} />}
            {log.data && log.data.length === 0 && <p className="text-sm text-midnight/50">No role changes yet.</p>}
            <ul className="space-y-2 text-xs">
              {log.data?.map((c) => (
                <li key={c.id} className="rounded-xl bg-cream p-2.5">
                  <b>{c.user_email}</b>: {c.old_role ? ROLE_LABELS[c.old_role] : "—"} → {ROLE_LABELS[c.new_role]}
                  <span className="block text-midnight/50">
                    by {c.changed_by_email ?? "system"} · {fmt(c.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
