import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(req: NextRequest) {
  // Use service role key to bypass RLS on all DB operations in this webhook
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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

  // ── Appointment Payment Events ───────────────────────────────

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const bookingId  = pi.metadata?.booking_id;
    const depositOnly = pi.metadata?.deposit_only === "true";
    const amount = pi.amount / 100;

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

    if (bookingId) {
      await supabase.from("appointments").update({
        status: "confirmed",
        payment_status: depositOnly ? "deposit_paid" : "paid",
        payment_intent_id: pi.id,
      }).eq("id", bookingId);

      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://featuresalon.co.uk";
        const emailRes = await fetch(`${appUrl}/api/send-confirmation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId: bookingId }),
        });
        const emailJson = await emailRes.json();
        if (!emailRes.ok) console.error("[Webhook] send-confirmation failed:", emailJson);
        else console.log("[Webhook] Confirmation emails sent:", emailJson);
      } catch (emailErr) {
        console.error("[Webhook] send-confirmation exception:", emailErr);
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
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
        notes: `⚠️ Payment failed on ${new Date().toLocaleDateString("en-GB")}. Client may need to rebook.`,
      }).eq("id", bookingId);
    }
  }

  // ── Subscription Events ──────────────────────────────────────

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const salonId = sub.metadata?.salon_id;
    const plan    = sub.metadata?.plan || "starter";
    if (salonId) {
      const customerId = typeof sub.customer === "string" ? sub.customer : (sub.customer as Stripe.Customer).id;
      await supabase.from("salons").update({
        subscription_id:     sub.id,
        subscription_status: sub.status,
        subscription_plan:   plan,
        stripe_customer_id:  customerId,
        trial_ends_at:       sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        // current_period_end varies by Stripe SDK version — cast to any for safety
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        current_period_end:  (sub as any).current_period_end
          ? new Date((sub as any).current_period_end * 1000).toISOString()
          : (sub as any).current_period?.end
          ? new Date((sub as any).current_period.end * 1000).toISOString()
          : null,
      }).eq("id", salonId);
      console.log(`[Webhook] ${event.type} salon=${salonId} status=${sub.status} plan=${plan}`);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const salonId = sub.metadata?.salon_id;
    if (salonId) {
      await supabase.from("salons").update({
        subscription_status: "cancelled",
        subscription_id:     null,
      }).eq("id", salonId);
      console.log(`[Webhook] subscription.deleted salon=${salonId}`);
    }
  }

  if (event.type === "invoice.payment_failed") {
    const inv = event.data.object as Stripe.Invoice;
    const customerId = typeof inv.customer === "string" ? inv.customer : (inv.customer as Stripe.Customer)?.id;
    if (customerId) {
      await supabase.from("salons").update({ subscription_status: "past_due" }).eq("stripe_customer_id", customerId);
      console.log(`[Webhook] invoice.payment_failed customer=${customerId}`);
    }
  }

  return NextResponse.json({ received: true });
}