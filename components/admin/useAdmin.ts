"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/components/Providers";
import { getSupabase, type Supabase } from "@/lib/supabase/client";

/** Admin pages only render inside AdminShell, which guarantees a configured client. */
export const adminDb = () => getSupabase() as Supabase;

type Result<T> = { data: T | null; error: { message: string } | null };

/** Runs a Supabase query on mount (and on reload), tracking loading and error state. */
export function useAdminQuery<T>(run: (sb: Supabase) => PromiseLike<Result<T>>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const runRef = useRef(run);
  runRef.current = run;

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await runRef.current(adminDb());
    setError(res.error?.message ?? null);
    if (!res.error) setData(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, ...deps]);

  return { data, error, loading, reload, setData };
}

/** Awaits a write and reports the outcome as a toast. Returns true on success. */
export async function saveWith(p: PromiseLike<{ error: { message: string } | null }>, success: string) {
  const { error } = await p;
  if (error) {
    toast({ title: "Couldn't save", body: error.message, kind: "ok" });
    return false;
  }
  toast({ title: success, kind: "ok" });
  return true;
}
