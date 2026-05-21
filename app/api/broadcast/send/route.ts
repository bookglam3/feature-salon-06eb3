import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOfferEmail } from "@/app/lib/email";
import { sendSMS } from "@/app/lib/sms";
import { sendWhatsApp } from "@/app/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow up to 5 minutes for large client lists
export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const {
      broadcastId,
      salonId,
      salonName,
      salonSlug,
      channel,
      title,
      message,
      clients, // [{ name, email, phone }]
    } = await req.json();

    if (!salonId || !channel || !message || !clients?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://featuresalon.co.uk";
    const bookingLink = `${appUrl}/book/${salonSlug}`;

    let sent = 0;
    const errors: string[] = [];

    for (const client of clients) {
      // Personalise the message
      const personalised = message
        .replace(/{name}/g, client.name || "there")
        .replace(/{salon}/g, salonName || "us")
        .replace(/{link}/g, bookingLink);

      try {
        if (channel === "email" && client.email) {
          await sendOfferEmail({
            to:           client.email,
            clientName:   client.name || "Valued Client",
            salonName:    salonName || "Your Salon",
            offerTitle:   title,
            offerDescription: personalised,
            bookingLink,
          });
          sent++;
        } else if (channel === "sms" && client.phone) {
          await sendSMS(client.phone, personalised, salonName);
          sent++;
        } else if (channel === "whatsapp" && client.phone) {
          await sendWhatsApp(client.phone, personalised);
          sent++;
        }
      } catch (e) {
        errors.push(`${client.name} (${client.email || client.phone}): ${e}`);
      }
    }

    // Update broadcast record with actual sent count
    if (broadcastId) {
      await supabase
        .from("broadcast_messages")
        .update({ status: errors.length === 0 ? "sent" : "partial", recipient_count: sent })
        .eq("id", broadcastId);
    }

    return NextResponse.json({ success: true, sent, errors: errors.length > 0 ? errors : undefined });

  } catch (err) {
    console.error("[broadcast/send] Error:", err);
    return NextResponse.json({ error: "Failed to send broadcast" }, { status: 500 });
  }
}
