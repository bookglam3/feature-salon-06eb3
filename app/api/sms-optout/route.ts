import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normaliseUKPhone } from "@/app/lib/sms";

// Supabase with service-role for writing opt-outs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/sms-optout
 *
 * Twilio webhook: called when a client replies STOP, UNSUBSCRIBE, CANCEL, etc.
 * Configure this URL in Twilio Console → Phone Numbers → Messaging → "A message comes in"
 *
 * Twilio sends a URL-encoded form body with `From` = the sender's phone number.
 */
export async function POST(req: Request) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    const fromRaw = params.get("From") || "";
    const body    = (params.get("Body") || "").trim().toUpperCase();

    // Twilio handles STOP/UNSUBSCRIBE/CANCEL/QUIT/END automatically,
    // but we also record it ourselves for internal opt-out checks.
    const optOutKeywords = ["STOP", "UNSUBSCRIBE", "CANCEL", "QUIT", "END"];
    const isOptOut = optOutKeywords.some(k => body.startsWith(k));

    if (isOptOut && fromRaw) {
      const phone = normaliseUKPhone(fromRaw) ?? fromRaw;
      await supabase
        .from("sms_opt_outs")
        .upsert({ phone }, { onConflict: "phone" });

      console.log(`[SMS Opt-out] Recorded STOP from ${phone}`);
    }

    // Twilio expects an empty TwiML response (no reply message)
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  } catch (err) {
    console.error("[SMS Opt-out] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
