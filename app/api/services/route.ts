import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS, trusted server-side only
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper: verify the request comes from a logged-in salon owner
// Returns the salon row if valid, null otherwise
async function getOwnerSalon(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  // Verify JWT with Supabase
  const { data: { user }, error } = await adminSupabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: salon } = await adminSupabase
    .from("salons")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  return salon ?? null;
}

// ── GET /api/services — list services for authenticated owner
export async function GET(req: NextRequest) {
  const salon = await getOwnerSalon(req);
  if (!salon) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await adminSupabase
    .from("services")
    .select("*")
    .eq("salon_id", salon.id)
    .order("price", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ services: data });
}

// ── POST /api/services — create a new service
export async function POST(req: NextRequest) {
  const salon = await getOwnerSalon(req);
  if (!salon) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { name, price, duration_minutes, description } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Service name is required" }, { status: 400 });
  if (!price || parseFloat(price) <= 0) return NextResponse.json({ error: "Price must be greater than 0" }, { status: 400 });

  const payload: Record<string, unknown> = {
    salon_id: salon.id,
    name: name.trim(),
    price: parseFloat(price),
    duration_minutes: parseInt(duration_minutes) || null,
  };
  if (description?.trim()) payload.description = description.trim();

  const { data, error } = await adminSupabase.from("services").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data });
}

// ── PATCH /api/services — update an existing service
export async function PATCH(req: NextRequest) {
  const salon = await getOwnerSalon(req);
  if (!salon) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { id, name, price, duration_minutes, description } = body;

  if (!id) return NextResponse.json({ error: "Service ID required" }, { status: 400 });

  const payload: Record<string, unknown> = {
    name: name?.trim(),
    price: parseFloat(price),
    duration_minutes: parseInt(duration_minutes) || null,
  };
  if (description?.trim()) payload.description = description.trim();
  else payload.description = null;

  const { error } = await adminSupabase
    .from("services")
    .update(payload)
    .eq("id", id)
    .eq("salon_id", salon.id); // extra safety: can only update own salon's services

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// ── DELETE /api/services — delete a service
export async function DELETE(req: NextRequest) {
  const salon = await getOwnerSalon(req);
  if (!salon) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Service ID required" }, { status: 400 });

  const { error } = await adminSupabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("salon_id", salon.id); // extra safety

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
