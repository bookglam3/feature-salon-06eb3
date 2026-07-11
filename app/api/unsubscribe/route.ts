import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/unsubscribe — sets marketing_opt_out on the client record
// matching { email, salon: slug }. Deliberately unauthenticated (this is
// a public email-unsubscribe link) — worst case is a marketing opt-out,
// never a data read, so no session is required.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const salonSlug = String(body?.salon || "").trim();

  if (!email || !EMAIL_RE.test(email) || !salonSlug) {
    return NextResponse.json({ error: "Invalid unsubscribe link." }, { status: 400 });
  }

  const { data: salon } = await adminSupabase
    .from("salons")
    .select("id,name")
    .eq("slug", salonSlug)
    .maybeSingle();
  if (!salon) return NextResponse.json({ error: "Salon not found." }, { status: 404 });

  const { data: existing } = await adminSupabase
    .from("clients")
    .select("id")
    .eq("salon_id", salon.id)
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    await adminSupabase
      .from("clients")
      .update({ marketing_opt_out: true, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    // No persisted client record yet (e.g. a booking-only client) —
    // create a minimal stub so the opt-out is durable.
    await adminSupabase.from("clients").insert({
      salon_id: salon.id,
      name: email.split("@")[0],
      email,
      marketing_opt_out: true,
      source: "manual",
    });
  }

  return NextResponse.json({ ok: true, salonName: salon.name });
}
