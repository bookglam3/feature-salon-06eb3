import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  const results: Record<string, unknown> = {};

  // 1. Env check
  results.env = {
    supabase_url:        process.env.NEXT_PUBLIC_SUPABASE_URL      ? "✅ set" : "❌ MISSING",
    stripe_secret:       process.env.STRIPE_SECRET_KEY             ? "✅ set" : "❌ MISSING",
    stripe_publishable:  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "✅ set" : "❌ MISSING",
    resend_api_key:      process.env.RESEND_API_KEY                ? "✅ set (len=" + process.env.RESEND_API_KEY.length + ")" : "❌ MISSING",
    from_email:          process.env.FROM_EMAIL                    || "not set (using onboarding@resend.dev)",
    app_url:             process.env.NEXT_PUBLIC_APP_URL           || "not set",
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET       ? "✅ set" : "❌ MISSING",
  };

  // 2. RLS test — appointment insert
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
    .select().single();

  results.rls_insert_test = testInsert.error
    ? `❌ code=${testInsert.error.code}: ${testInsert.error.message}`
    : "✅ INSERT OK — id: " + testInsert.data?.id;

  if (testInsert.data?.id) {
    await supabase.from("appointments").delete().eq("id", testInsert.data.id);
  }

  // 3. Check salons — name, owner_email, payment_methods
  const { data: salons, error: salonsErr } = await supabase
    .from("salons")
    .select("id, name, owner_email, payment_methods, slug")
    .limit(5);

  results.salons = salonsErr
    ? "❌ " + salonsErr.message
    : salons?.map(s => ({
        name: s.name,
        slug: s.slug,
        owner_email: s.owner_email || "⚠️ NULL — emails won't send!",
        payment_methods: s.payment_methods,
      }));

  // 4. Resend test — send real email
  const { data: emailData, error: emailErr } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: "bookglam3@gmail.com",
    subject: "✅ Diagnostic: Resend is working on " + new Date().toLocaleTimeString("en-GB"),
    html: `<h2>Resend diagnostic email</h2>
           <p>If you see this, Resend is configured correctly on production.</p>
           <p>Sent at: ${new Date().toISOString()}</p>
           <p>RESEND_API_KEY length: ${process.env.RESEND_API_KEY?.length || 0}</p>
           <p>FROM_EMAIL: ${process.env.FROM_EMAIL || "onboarding@resend.dev"}</p>`,
  });

  results.resend_test = emailErr
    ? `❌ Resend error: ${JSON.stringify(emailErr)}`
    : `✅ Email sent — id: ${emailData?.id}`;

  // 5. Check most recent appointments
  const { data: recentAppts } = await supabase
    .from("appointments")
    .select("id, client_name, client_email, status, payment_status, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  results.recent_appointments = recentAppts || "none found";

  return NextResponse.json(results, { status: 200 });
}
