import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPER_ADMIN = "adilgill2008@gmail.com";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Auth guard ─────────────────────────────────────────────────
async function verifyAdmin(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user || user.email !== SUPER_ADMIN) return null;
  return user;
}

// ── GET — list all salons with last login location ─────────────
export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // All salons
  const { data: salons, error } = await supabaseAdmin
    .from("salons")
    .select("id,name,slug,owner_id,owner_email,plan,subscription_status,subscription_plan,trial_ends_at,created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Latest login per salon (for IP + location)
  const { data: logs } = await supabaseAdmin
    .from("login_logs")
    .select("salon_id,ip_address,city,country,country_code,device,logged_at")
    .order("logged_at", { ascending: false });

  // Map: salon_id → latest log
  const logMap: Record<string, { ip_address: string; city: string; country: string; country_code: string; device: string; logged_at: string }> = {};
  (logs || []).forEach(l => {
    if (l.salon_id && !logMap[l.salon_id]) logMap[l.salon_id] = l;
  });

  const enriched = (salons || []).map(s => ({
    ...s,
    last_ip:       logMap[s.id]?.ip_address  || null,
    last_city:     logMap[s.id]?.city         || null,
    last_country:  logMap[s.id]?.country      || null,
    country_code:  logMap[s.id]?.country_code || null,
    last_device:   logMap[s.id]?.device       || null,
    last_login_at: logMap[s.id]?.logged_at    || null,
  }));

  return NextResponse.json({ salons: enriched });
}

// ── PATCH — edit salon (status, plan, name) ────────────────────
export async function PATCH(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, subscription_status, subscription_plan, name } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, string> = {};
  if (subscription_status) updates.subscription_status = subscription_status;
  if (subscription_plan)   updates.subscription_plan   = subscription_plan;
  if (name)                updates.name                = name;

  const { error } = await supabaseAdmin.from("salons").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
