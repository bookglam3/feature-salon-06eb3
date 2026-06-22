import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBookingEmails } from "@/app/lib/email";
import { sendWhatsAppConfirmation } from "@/app/lib/whatsapp";
import { sendSMS, formatUKDate, formatUKTime } from "@/app/lib/sms";

export const dynamic = "force-dynamic";

/**
 * POST /api/send-confirmation
 * Called immediately after appointment is confirmed (both Stripe and pay-at-salon paths).
 * Body: { appointmentId: string }
 *
 * Fetches full appointment data from Supabase, resolves owner email from
 * salon.owner_email or the salon owner's auth account, then fires both emails.
 */
export async function POST(req: NextRequest) {
  try {
    const { appointmentId } = await req.json();
    if (!appointmentId) {
      return NextResponse.json({ error: "Missing appointmentId" }, { status: 400 });
    }

    // MUST use service role key — anon key is blocked by RLS for admin lookups
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch appointment with all related data
    // Also check created_at — only allow re-sending confirmation within 15 minutes of booking
    const { data: appt, error } = await supabase
      .from("appointments")
      .select(`
        *,
        services(name, price),
        staff(name),
        salons(id, name, slug, address, owner_email, owner_id, reminders_enabled, whatsapp_enabled, business_type)
      `)
      .eq("id", appointmentId)
      .gte("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString())
      .single();

    if (error || !appt) {
      console.error("[send-confirmation] Appointment fetch error:", error);
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const salon = appt.salons;

    // Resolve owner email: salon.owner_email first, then look up auth user
    let ownerEmail = salon?.owner_email || "";
    if (!ownerEmail && salon?.owner_id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(salon.owner_id);
      ownerEmail = authUser?.user?.email || "";
    }

    // Final fallback — don't block client email if owner email unknown
    const clientEmail = appt.client_email;
    if (!clientEmail) {
      return NextResponse.json({ error: "No client email on appointment" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://featuresalon.co.uk";

    console.log(`[send-confirmation] Sending to client=${clientEmail}, owner=${ownerEmail || "NONE"}`);

    await sendBookingEmails({
      clientEmail,
      clientName:      appt.client_name,
      clientPhone:     appt.client_phone || "",
      serviceName:     appt.services?.name || "Appointment",
      dateTime:        appt.date_time,
      staffName:       appt.staff?.name,
      salonName:       salon?.name || "The Salon",
      salonOwnerEmail: ownerEmail || clientEmail, // fallback: send owner copy to client
      price:           appt.services?.price,
      salonAddress:    salon?.address,
      cancelLink:      `${appUrl}/reschedule/${appointmentId}?token=${appt.review_token}`,
      dashboardUrl:    `${appUrl}/dashboard/bookings`,
      paymentStatus:   appt.payment_status,
      depositOnly:     appt.payment_status === "deposit_paid",
      businessType:    salon?.business_type,
    });

    // ── WhatsApp Confirmation ────────────────────────────────
    let whatsappSent = false;
    if (appt.client_phone && salon?.whatsapp_enabled) {
      try {
        await sendWhatsAppConfirmation({
          to:           appt.client_phone,
          clientName:   appt.client_name,
          serviceName:  appt.services?.name || "Appointment",
          staffName:    appt.staff?.name,
          salonName:    salon?.name || "The Salon",
          salonAddress: salon?.address,
          dateTime:     appt.date_time,
          price:        appt.services?.price,
          cancelLink:   `${appUrl}/reschedule/${appointmentId}?token=${appt.review_token}`,
        });
        await supabase
          .from("appointments")
          .update({ whatsapp_confirmation_sent: true })
          .eq("id", appointmentId);
        whatsappSent = true;
        console.log(`[send-confirmation] ✅ WhatsApp sent for appointment ${appointmentId}`);
      } catch (waErr) {
        console.error("[send-confirmation] WhatsApp error (non-fatal):", waErr);
      }
    }

    // ── SMS Confirmation ─────────────────────────────────────
    let smsSent = false;
    if (appt.client_phone) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://featuresalon.co.uk";
        const dateLabel = formatUKDate(appt.date_time);
        const timeLabel = formatUKTime(appt.date_time);
        const body = `Hi ${appt.client_name}, your booking at ${salon?.name || "the salon"} is confirmed!\n${appt.services?.name} on ${dateLabel} at ${timeLabel}.\nManage: ${appUrl}/reschedule/${appointmentId}?token=${appt.review_token}`;
        await sendSMS(appt.client_phone, body, salon?.name);
        smsSent = true;
        console.log(`[send-confirmation] ✅ SMS sent for appointment ${appointmentId}`);
      } catch (smsErr) {
        console.error("[send-confirmation] SMS error (non-fatal):", smsErr);
      }
    }

    console.log(`[send-confirmation] ✅ Emails sent for appointment ${appointmentId}`);
    return NextResponse.json({ success: true, whatsappSent, smsSent });

  } catch (err) {
    console.error("[send-confirmation] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
