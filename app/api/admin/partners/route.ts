import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Admin -> Brand Partners: create a partner login with a password, or reset a partner's password.
 *
 * The Supabase secret (service-role) key is read here, on the server only, from SUPABASE_SERVICE_ROLE_KEY (or
 * SUPABASE_SECRET_KEY). It is never sent to the browser. Every request must carry a signed-in admin's access token,
 * checked with public.is_admin(). Passwords are passed straight to Supabase Auth and never stored or logged.
 */
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const json = (status: number, body: Record<string, unknown>) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (e) {
    console.error("Lovioo partners API:", e instanceof Error ? e.message : e);
    return json(500, { error: "Something went wrong. Please try again." });
  }
}

async function handle(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !publishable) return json(500, { error: "Supabase isn't configured on the server." });

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json(401, { error: "Sign in as an admin first." });
  const asCaller = createClient<Database>(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [{ data: caller }, { data: isAdmin, error: roleError }] = await Promise.all([asCaller.auth.getUser(token), asCaller.rpc("is_admin")]);
  if (roleError || !isAdmin || !caller.user) return json(403, { error: "Only Lovioo admins can manage brand partner logins." });

  if (!secret) {
    return json(503, {
      error:
        "Partner logins can't be created here yet: add SUPABASE_SERVICE_ROLE_KEY in Vercel → Settings → Environment Variables (Production), then redeploy. Until then, create the user in the Supabase dashboard and use “Link an existing account”.",
      code: "no_service_key",
    });
  }
  const admin = createClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  let body: { action?: string; brand?: string; email?: string; password?: string; name?: string; userId?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Bad request." });
  }
  const password = String(body.password ?? "");
  if (password.length < 10 || password.length > 72) return json(400, { error: "Use a password of 10 to 72 characters." });

  if (body.action === "create") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const brand = String(body.brand ?? "");
    const name = String(body.name ?? "").trim().slice(0, 80);
    if (!EMAIL.test(email)) return json(400, { error: "Enter a valid email address." });
    const { data: b } = await admin.from("brands").select("id, name").eq("id", brand).maybeSingle();
    if (!b) return json(400, { error: "Pick a brand." });

    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name || b.name, partner_brand: b.id },
    });
    if (created.error || !created.data.user) {
      const exists = /already|registered|exists/i.test(created.error?.message ?? "");
      return json(exists ? 409 : 400, {
        error: exists ? "That email already has a Lovioo account. Use “Link an existing account” instead." : created.error?.message ?? "Couldn't create the login.",
      });
    }
    const userId = created.data.user.id;
    const link = await admin.from("brand_members").insert({ user_id: userId, brand_id: b.id, created_by: caller.user.id });
    if (link.error) return json(500, { error: `Login created, but linking it to ${b.name} failed: ${link.error.message}` });
    await admin.from("brands").update({ is_partner: true }).eq("id", b.id);
    return json(200, { ok: true, userId });
  }

  if (body.action === "reset-password") {
    const userId = String(body.userId ?? "");
    if (!UUID.test(userId)) return json(400, { error: "Unknown login." });
    // Only brand partner logins can be reset here, never staff or shoppers.
    const { data: member } = await admin.from("brand_members").select("user_id").eq("user_id", userId).limit(1).maybeSingle();
    if (!member) return json(404, { error: "That login isn't a brand partner." });
    const res = await admin.auth.admin.updateUserById(userId, { password });
    if (res.error) return json(400, { error: res.error.message });
    return json(200, { ok: true });
  }

  return json(400, { error: "Unknown action." });
}
