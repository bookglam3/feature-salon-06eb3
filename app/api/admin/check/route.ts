import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/check
 * Verifies the caller's bearer token server-side and returns { isAdmin: boolean }.
 * The admin email comes from SUPER_ADMIN_EMAIL env var — never hardcoded in client code.
 */
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ isAdmin: false }, { status: 401 });

  const { data: { user }, error } = await adminSupabase.auth.getUser(token);
  if (error || !user) return NextResponse.json({ isAdmin: false }, { status: 401 });

  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("[admin/check] SUPER_ADMIN_EMAIL is not set in env");
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }

  return NextResponse.json({ isAdmin: user.email === adminEmail });
}
