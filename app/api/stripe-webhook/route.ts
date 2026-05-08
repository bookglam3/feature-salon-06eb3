import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendBookingEmails } from "@/app/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook error";
    console.error("Webhook signature failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const pi = event.data.object as Stripe.PaymentIntent;

  if (event.type === "payment_intent.succeeded") {
    const bookingId = pi.metadata?.booking_id;
    const depositOnly = pi.metadata?.deposit_only === "true";
    const amount = pi.amount / 100;

    // Save payment record
    await supabase.from("payments").insert({
      appointment_id: bookingId || null,
      stripe_payment_intent_id: pi.id,
      amount,
      currency: pi.currency,
      status: "succeeded",
      deposit_only: depositOnly,
      receipt_email: pi.receipt_email,
      created_at: new Date().toISOString(),
    });

    // Update appointment status
    if (bookingId) {
      await supabase.from("appointments").update({
        status: "confirmed",
        payment_status: depositOnly ? "deposit_paid" : "paid",
        payment_intent_id: pi.id,
      }).eq("id", bookingId);

      // ── Fire booking confirmation email ──────────────────────
      try {
        // Fetch full appointment with related data
        const { data: appt } = await supabase
          .from("appointments")
          .select("*, services(name,price), staff(name), salons(name,slug,address,owner_email,reminders_enabled)")
          .eq("id", bookingId)
          .single();

        if (appt?.client_email && appt?.salons?.owner_email) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
          await sendBookingEmails({
            clientEmail:     appt.client_email,
            clientName:      appt.client_name,
            clientPhone:     appt.client_phone || "",
            serviceName:     appt.services?.name || "Appointment",
            dateTime:        appt.date_time,
            staffName:       appt.staff?.name,
            salonName:       appt.salons.name,
            salonOwnerEmail: appt.salons.owner_email,
            price:           appt.services?.price,
            salonAddress:    appt.salons.address,
            cancelLink:      `${appUrl}/book/${appt.salons.slug}`,
            dashboardUrl:    `${appUrl}/dashboard/bookings`,
            paymentStatus:   depositOnly ? "deposit_paid" : "paid",
            depositOnly,
          });
        }
      } catch (emailErr) {
        // Don't fail the webhook if email fails
        console.error("[Webhook] Booking confirmation email failed:", emailErr);
      }
    }
  } // end payment_intent.succeeded

  if (event.type === "payment_intent.payment_failed") {
    const bookingId = pi.metadata?.booking_id;

    await supabase.from("payments").insert({
      appointment_id: bookingId || null,
      stripe_payment_intent_id: pi.id,
      amount: pi.amount / 100,
      currency: pi.currency,
      status: "failed",
      deposit_only: pi.metadata?.deposit_only === "true",
      receipt_email: pi.receipt_email,
      created_at: new Date().toISOString(),
    });

    if (bookingId) {
      await supabase.from("appointments").update({
        payment_status: "failed",
      }).eq("id", bookingId);
    }
  }

  return NextResponse.json({ received: true });
}