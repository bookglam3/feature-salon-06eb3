import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

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

      // ── Fire booking confirmation email via dedicated route ──
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://featuresalon.co.uk";
        const emailRes = await fetch(`${appUrl}/api/send-confirmation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId: bookingId }),
        });
        const emailJson = await emailRes.json();
        if (!emailRes.ok) {
          console.error("[Webhook] send-confirmation failed:", emailJson);
        } else {
          console.log("[Webhook] Confirmation emails sent:", emailJson);
        }
      } catch (emailErr) {
        console.error("[Webhook] send-confirmation exception:", emailErr);
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