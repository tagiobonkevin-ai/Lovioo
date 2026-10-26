"use client";

import { Check, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { adminDb, saveWith, useAdminQuery } from "@/components/admin/useAdmin";
import { ErrorNote, PageHeader, Panel, Skeleton } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

const MOODS = ["😞", "😕", "😐", "🙂", "😍"];

export default function AdminFeedback() {
  const [tab, setTab] = useState<"new" | "handled" | "all">("new");
  const { data, error, loading, setData } = useAdminQuery((sb) => sb.from("feedback").select("*").order("created_at", { ascending: false }).limit(500));

  const rows = useMemo(() => (data ?? []).filter((f) => tab === "all" || f.status === tab), [data, tab]);
  const rated = (data ?? []).filter((f) => f.rating);
  const avg = rated.length ? rated.reduce((n, f) => n + (f.rating ?? 0), 0) / rated.length : null;

  const setStatus = async (id: number, status: "new" | "handled") => {
    if (await saveWith(adminDb().from("feedback").update({ status }).eq("id", id), status === "handled" ? "Marked as handled" : "Moved back to new"))
      setData((d) => d?.map((f) => (f.id === id ? { ...f, status } : f)) ?? null);
  };

  return (
    <div>
      <PageHeader
        title="Feedback"
        sub={data ? `${data.filter((f) => f.status === "new").length} new · ${data.length} total${avg ? ` · average mood ${MOODS[Math.round(avg) - 1]} ${avg.toFixed(1)}/5` : ""}` : undefined}
      />
      <div className="mb-4 flex gap-2">
        {(["new", "handled", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("chip capitalize", tab === t && "chip-active")}>
            {t}
          </button>
        ))}
      </div>
      {error && <ErrorNote message={error} />}
      {loading && !data && <Skeleton className="h-64" />}
      {data && (
        <Panel>
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink/50">{tab === "new" ? "No new feedback — inbox zero 🎉" : "Nothing here yet."}</p>
          ) : (
            <ul className="divide-y divide-ink/10/70">
              {rows.map((f) => (
                <li key={f.id} className="flex gap-4 py-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ink/[0.03] text-xl">{f.rating ? MOODS[f.rating - 1] : "💬"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-wrap break-words text-sm">{f.message}</p>
                    <p className="mt-1 text-xs text-ink/50">
                      {new Date(f.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
                      {f.page && ` · on ${f.page}`}
                      {f.email ? ` · ${f.email}` : " · anonymous"}
                    </p>
                  </div>
                  {f.status === "new" ? (
                    <button onClick={() => setStatus(f.id, "handled")} className="btn-ghost h-9 shrink-0 !px-3 !py-1.5 text-xs" aria-label="Mark as handled">
                      <Check className="h-4 w-4" /> <span className="hidden sm:inline">Handled</span>
                    </button>
                  ) : (
                    <button onClick={() => setStatus(f.id, "new")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/40 hover:bg-ink/[0.03]" aria-label="Move back to new">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}
