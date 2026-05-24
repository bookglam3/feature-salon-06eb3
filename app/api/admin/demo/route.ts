import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest } from "@/app/lib/adminAuth";

const DEMO_USER_ID = "c8d9e0f1-a2b3-4c4d-85e6-f7a8b9c0d1e2";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── GET — demo account status ─────────────────────────────────
export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin)                          return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (admin.role !== "super_admin")    return NextResponse.json({ error: "Forbidden" },    { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("demo_enabled, demo_expires_at, last_login_at")
    .eq("id", DEMO_USER_ID)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ── PATCH — toggle / extend demo access ──────────────────────
// Body: { enabled?: boolean, extend_hours?: number }
export async function PATCH(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin)                          return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (admin.role !== "super_admin")    return NextResponse.json({ error: "Forbidden" },    { status: 403 });

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};

  if (typeof body.enabled === "boolean") {
    updates.demo_enabled = body.enabled;
    if (!body.enabled) {
      updates.demo_expires_at = new Date().toISOString();
    }
  }

  if (typeof body.extend_hours === "number" && body.extend_hours > 0) {
    const newExpiry = new Date(Date.now() + body.extend_hours * 3_600_000);
    updates.demo_expires_at = newExpiry.toISOString();
    updates.demo_enabled    = true;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .update(updates)
    .eq("id", DEMO_USER_ID)
    .select("demo_enabled, demo_expires_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, ...data });
}
