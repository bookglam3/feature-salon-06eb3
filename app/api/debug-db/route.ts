import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Diagnostic endpoint — shows DB column status and RLS policies
// GET /api/debug-db
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const results: Record<string, unknown> = {};

  // 1. Check appointments columns
  const { data: apptCols, error: apptColErr } = await supabase
    .rpc("get_table_columns", { tbl: "appointments" })
    .select("*");

  results.columns_rpc_error = apptColErr?.message;

  // 2. Try a test insert to appointments with minimal data
  // (use a fake salon_id that won't conflict)
  const testInsert = await supabase
    .from("appointments")
    .insert({
      salon_id: "00000000-0000-0000-0000-000000000000",
      client_name: "DIAGNOSTIC_TEST",
      client_email: "diag@test.com",
      client_phone: "07000000000",
      date_time: new Date(Date.now() + 86400000).toISOString(),
      status: "pending",
      payment_status: "pending",
    })
    .select()
    .single();

  results.test_insert_error = testInsert.error
    ? { code: testInsert.error.code, message: testInsert.error.message, details: testInsert.error.details }
    : "INSERT OK — id: " + testInsert.data?.id;

  // Clean up test row if it was inserted
  if (testInsert.data?.id) {
    await supabase.from("appointments").delete().eq("id", testInsert.data.id);
    results.test_insert_cleanup = "deleted";
  }

  // 3. Test insert WITH payment_method column
  const testInsert2 = await supabase
    .from("appointments")
    .insert({
      salon_id: "00000000-0000-0000-0000-000000000000",
      client_name: "DIAGNOSTIC_TEST_PM",
      client_email: "diag2@test.com",
      client_phone: "07000000001",
      date_time: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: "pending",
      payment_status: "pending",
      payment_method: "full_online",
    })
    .select()
    .single();

  results.test_insert_with_pm_error = testInsert2.error
    ? { code: testInsert2.error.code, message: testInsert2.error.message }
    : "INSERT WITH payment_method OK — id: " + testInsert2.data?.id;

  if (testInsert2.data?.id) {
    await supabase.from("appointments").delete().eq("id", testInsert2.data.id);
  }

  // 4. Check salons table for payment_methods column
  const { data: salon, error: salonErr } = await supabase
    .from("salons")
    .select("id, name, payment_methods")
    .limit(1)
    .single();

  results.salons_payment_methods = salonErr
    ? "ERROR: " + salonErr.message
    : { has_column: "payment_methods" in (salon || {}), value: salon?.payment_methods };

  // 5. Env check
  results.env = {
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ set" : "❌ MISSING",
    stripe_secret: process.env.STRIPE_SECRET_KEY ? "✅ set" : "❌ MISSING",
    stripe_publishable: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "✅ set" : "❌ MISSING",
    app_url: process.env.NEXT_PUBLIC_APP_URL || "not set",
  };

  return NextResponse.json(results, { status: 200 });
}
