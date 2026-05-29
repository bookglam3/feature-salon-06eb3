import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ApptRow = {
  id: string;
  salon_id: string;
  client_name: string;
  date_time: string;
  status: string;
  services: { name: string } | { name: string }[] | null;
  salons:   { name: string } | { name: string }[] | null;
};

function unwrap<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

// GET /api/reviews?token=<uuid>
// Validates a review token. Returns appointment context (NO private data).
// Never returns review_token, client email, phone, or other accounts' data.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ valid: false, reason: "missing_token" });

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("id, salon_id, client_name, date_time, status, services(name), salons(name)")
    .eq("review_token", token)
    .single();

  if (error || !data) return NextResponse.json({ valid: false, reason: "not_found" });

  const appt = data as ApptRow;

  if (appt.status === "cancelled")
    return NextResponse.json({ valid: false, reason: "cancelled" });

  if (new Date(appt.date_time) > new Date())
    return NextResponse.json({ valid: false, reason: "upcoming", appt_date: appt.date_time });

  const { data: existing } = await supabaseAdmin
    .from("reviews")
    .select("id")
    .eq("appointment_id", appt.id)
    .maybeSingle();

  if (existing)
    return NextResponse.json({ valid: false, reason: "already_reviewed" });

  const salon   = unwrap(appt.salons);
  const service = unwrap(appt.services);

  return NextResponse.json({
    valid:        true,
    salon_name:   salon?.name   ?? "",
    service_name: service?.name ?? "",
    client_name:  appt.client_name,
    appt_date:    appt.date_time,
  });
}

// POST /api/reviews — submit a real client review
// Server re-validates everything before inserting. Uses service_role (bypasses RLS).
export async function POST(req: NextRequest) {
  let body: { token?: unknown; rating?: unknown; comment?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { token, rating, comment } = body;

  if (typeof token !== "string" || !token)
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5)
    return NextResponse.json({ error: "Rating must be a whole number 1–5" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("id, salon_id, client_name, date_time, status")
    .eq("review_token", token)
    .single();

  if (error || !data)
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });

  const appt = data as { id: string; salon_id: string; client_name: string; date_time: string; status: string };

  if (appt.status === "cancelled")
    return NextResponse.json({ error: "Appointment was cancelled" }, { status: 400 });
  if (new Date(appt.date_time) > new Date())
    return NextResponse.json({ error: "Appointment has not taken place yet" }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from("reviews")
    .select("id")
    .eq("appointment_id", appt.id)
    .maybeSingle();

  if (existing)
    return NextResponse.json({ error: "Review already submitted for this appointment" }, { status: 409 });

  const cleanComment =
    typeof comment === "string" && comment.trim()
      ? comment.trim().slice(0, 500)
      : null;

  const { error: insertErr } = await supabaseAdmin.from("reviews").insert({
    salon_id:       appt.salon_id,
    appointment_id: appt.id,
    client_name:    appt.client_name,
    rating,
    comment:        cleanComment,
    is_published:   true,
  });

  if (insertErr)
    return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
