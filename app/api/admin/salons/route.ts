import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest } from "@/app/lib/adminAuth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── GET — list salons (demo guests see only is_demo_data rows) ─
export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const isGuest = admin.role === "guest";

  let query = supabaseAdmin
    .from("salons")
    .select("id,name,slug,owner_id,owner_email,plan,subscription_status,subscription_plan,trial_ends_at,created_at")
    .order("created_at", { ascending: false });

  if (isGuest) {
    query = query.eq("is_demo_data", true);
  } else {
    query = query.eq("is_demo_data", false);
  }

  const { data: salons, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Latest login per salon
  let logsQuery = supabaseAdmin
    .from("login_logs")
    .select("salon_id,ip_address,city,country,country_code,device,logged_at")
    .order("logged_at", { ascending: false });

  if (isGuest) logsQuery = logsQuery.eq("is_demo_data", true);
  else         logsQuery = logsQuery.eq("is_demo_data", false);

  const { data: logs } = await logsQuery;

  type LogRow = NonNullable<typeof logs>[number];
  const logMap: Record<string, LogRow> = {};
  (logs ?? []).forEach(l => { if (l.salon_id && !logMap[l.salon_id]) logMap[l.salon_id] = l; });

  const enriched = (salons ?? []).map(s => ({
    ...s,
    last_ip:       logMap[s.id]?.ip_address  ?? null,
    last_city:     logMap[s.id]?.city         ?? null,
    last_country:  logMap[s.id]?.country      ?? null,
    country_code:  logMap[s.id]?.country_code ?? null,
    last_device:   logMap[s.id]?.device       ?? null,
    last_login_at: logMap[s.id]?.logged_at    ?? null,
  }));

  return NextResponse.json({ salons: enriched });
}

// ── PATCH — edit salon (guests cannot patch) ───────────────────
export async function PATCH(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin)                  return NextResponse.json({ error: "Forbidden" },    { status: 403 });
  if (admin.role === "guest")  return NextResponse.json({ error: "Read-only" },    { status: 403 });

  const body = await req.json();
  const { id, subscription_status, subscription_plan, name, timezone } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, string> = {};
  if (subscription_status) updates.subscription_status = subscription_status;
  if (subscription_plan)   updates.subscription_plan   = subscription_plan;
  if (name)                updates.name                = name;
  if (timezone)            updates.timezone            = timezone;

  const { error } = await supabaseAdmin
    .from("salons")
    .update(updates)
    .eq("id", id)
    .eq("is_demo_data", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
