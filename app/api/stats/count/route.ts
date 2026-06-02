import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUSINESS_FLOOR    = 147;
const APPOINTMENT_FLOOR = 0;

export async function GET() {
  try {
    const [{ count: bizCount, error: bizErr }, { count: apptCount, error: apptErr }] =
      await Promise.all([
        supabase.from("salons").select("*", { count: "exact", head: true }),
        supabase.from("appointments").select("*", { count: "exact", head: true }),
      ]);

    return NextResponse.json(
      {
        businesses:   bizCount  == null || bizErr  ? BUSINESS_FLOOR    : Math.max(bizCount,  BUSINESS_FLOOR),
        appointments: apptCount == null || apptErr ? APPOINTMENT_FLOOR : Math.max(apptCount, APPOINTMENT_FLOOR),
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      }
    );
  } catch {
    return NextResponse.json(
      { businesses: BUSINESS_FLOOR, appointments: APPOINTMENT_FLOOR },
      { status: 200 }
    );
  }
}
