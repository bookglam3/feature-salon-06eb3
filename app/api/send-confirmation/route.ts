import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBookingEmails } from "@/app/lib/email";

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

    // Use service role key for reading owner data safely
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch appointment with all related data
    const { data: appt, error } = await supabase
      .from("appointments")
      .select(`
        *,
        services(name, price),
        staff(name),
        salons(id, name, slug, address, owner_email, owner_id, reminders_enabled)
      `)
      .eq("id", appointmentId)
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
      cancelLink:      `${appUrl}/book/${salon?.slug}`,
      dashboardUrl:    `${appUrl}/dashboard/bookings`,
      paymentStatus:   appt.payment_status,
      depositOnly:     appt.payment_status === "deposit_paid",
    });

    console.log(`[send-confirmation] ✅ Emails sent for appointment ${appointmentId}`);
    return NextResponse.json({ success: true, clientEmail, ownerEmail });

  } catch (err) {
    console.error("[send-confirmation] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
