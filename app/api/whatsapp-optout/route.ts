import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalisePhone } from "@/app/lib/whatsapp";

// Use service-role key for writing opt-outs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/whatsapp-optout
 *
 * Twilio WhatsApp webhook — called when a client replies STOP (or similar)
 * to a WhatsApp message. Twilio handles the channel-level opt-out automatically;
 * we also record it in our shared sms_opt_outs table so the cron skips that number.
 *
 * Configure in Twilio Console:
 *   Messaging → Senders → WhatsApp sandbox → "A message comes in" webhook
 *   URL: https://feature-saas.vercel.app/api/whatsapp-optout
 *   Method: HTTP POST
 */
export async function POST(req: Request) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);

    // Twilio sends From as "whatsapp:+447911123456"
    const fromRaw = params.get("From") || "";
    const body    = (params.get("Body") || "").trim().toUpperCase();

    const optOutKeywords = ["STOP", "UNSUBSCRIBE", "CANCEL", "QUIT", "END", "STOPALL"];
    const isOptOut = optOutKeywords.some(k => body.startsWith(k));

    if (isOptOut && fromRaw) {
      // Strip the "whatsapp:" prefix before normalising
      const rawPhone = fromRaw.replace(/^whatsapp:/i, "");
      const phone = normalisePhone(rawPhone) ?? rawPhone;

      // Upsert into shared opt-out table (covers both SMS and WhatsApp)
      await supabase
        .from("sms_opt_outs")
        .upsert({ phone }, { onConflict: "phone" });

      console.log(`[WhatsApp Opt-out] ✅ Recorded STOP from ${phone}`);
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
    console.error("[WhatsApp Opt-out] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
