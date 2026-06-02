import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Never display below this floor — reflects real sign-ups before this counter was added
const FLOOR = 147;

export async function GET() {
  try {
    const { count, error } = await supabase
      .from("salons")
      .select("*", { count: "exact", head: true });

    if (error || count === null) {
      return NextResponse.json({ count: FLOOR }, { status: 200 });
    }

    return NextResponse.json(
      { count: Math.max(count, FLOOR) },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      }
    );
  } catch {
    return NextResponse.json({ count: FLOOR }, { status: 200 });
  }
}
