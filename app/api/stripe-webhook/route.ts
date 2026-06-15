import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendBookingEmails } from "@/app/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  // MUST use service role key — anon key is blocked by RLS in webhooks
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not configured — rejecting event");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("[webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // ── Appointment Payment Events ───────────────────────────────

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;

    // Idempotency: skip if this payment_intent was already processed
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("stripe_payment_intent_id", pi.id)
      .maybeSingle();
    if (existingPayment) {
      console.log(`[webhook] Duplicate event skipped — payment_intent ${pi.id} already processed`);
      return NextResponse.json({ received: true });
    }

    const bookingId  = pi.metadata?.booking_id;
    const depositOnly = pi.metadata?.deposit_only === "true";
    const amount = pi.amount / 100;

    const { error: paymentInsertErr } = await supabase.from("payments").insert({
      appointment_id: bookingId || null,
      stripe_payment_intent_id: pi.id,
      amount,
      currency: pi.currency,
      status: "succeeded",
      deposit_only: depositOnly,
      receipt_email: pi.receipt_email,
      created_at: new Date().toISOString(),
    });
    if (paymentInsertErr) {
      console.error("[webhook] payments insert failed:", paymentInsertErr.message);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (bookingId) {
      const { error: apptUpdateErr } = await supabase.from("appointments").update({
        status: "confirmed",
        payment_status: depositOnly ? "deposit_paid" : "paid",
        payment_intent_id: pi.id,
      }).eq("id", bookingId);
      if (apptUpdateErr) {
        console.error("[webhook] appointments update failed:", apptUpdateErr.message);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
      }

      // ── Send confirmation emails directly (no HTTP self-call) ──────────
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://featuresalon.co.uk";

        // Fetch full appointment data (same as send-confirmation route)
        const { data: appt } = await supabase
          .from("appointments")
          .select(`*, services(name,price), staff(name), salons(id,name,slug,address,owner_email,owner_id,business_type)`)
          .eq("id", bookingId)
          .single();

        if (appt) {
          const salon = appt.salons;
          let ownerEmail: string = salon?.owner_email || "";
          if (!ownerEmail && salon?.owner_id) {
            const { data: authUser } = await supabase.auth.admin.getUserById(salon.owner_id);
            ownerEmail = authUser?.user?.email || "";
          }

          await sendBookingEmails({
            clientEmail:      appt.client_email,
            clientName:       appt.client_name,
            clientPhone:      appt.client_phone || "",
            serviceName:      appt.services?.name || "Appointment",
            dateTime:         appt.date_time,
            staffName:        appt.staff?.name,
            salonName:        salon?.name || "The Salon",
            salonOwnerEmail:  ownerEmail || appt.client_email,
            price:            appt.services?.price,
            salonAddress:     salon?.address,
            cancelLink:       `${appUrl}/reschedule/${bookingId}`,
            dashboardUrl:     `${appUrl}/dashboard/bookings`,
            paymentStatus:    depositOnly ? "deposit_paid" : "paid",
            depositOnly,
            businessType:     salon?.business_type,
          });
          console.log(`[Webhook] ✅ Confirmation emails sent for booking ${bookingId}`);
        } else {
          console.error(`[Webhook] ❌ Appointment ${bookingId} not found for email`);
        }
      } catch (emailErr) {
        console.error("[Webhook] ❌ Email error (non-fatal):", emailErr);
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const bookingId = pi.metadata?.booking_id;

    // Idempotency: skip if this failure was already recorded
    const { data: existingFailure } = await supabase
      .from("payments")
      .select("id")
      .eq("stripe_payment_intent_id", pi.id)
      .eq("status", "failed")
      .maybeSingle();
    if (existingFailure) {
      console.log(`[webhook] Duplicate payment_failed skipped — ${pi.id}`);
      return NextResponse.json({ received: true });
    }

    const { error: failInsertErr } = await supabase.from("payments").insert({
      appointment_id: bookingId || null,
      stripe_payment_intent_id: pi.id,
      amount: pi.amount / 100,
      currency: pi.currency,
      status: "failed",
      deposit_only: pi.metadata?.deposit_only === "true",
      receipt_email: pi.receipt_email,
      created_at: new Date().toISOString(),
    });
    if (failInsertErr) {
      console.error("[webhook] failed payment insert error:", failInsertErr.message);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (bookingId) {
      const { error: failApptErr } = await supabase.from("appointments").update({
        payment_status: "failed",
        notes: `⚠️ Payment failed on ${new Date().toLocaleDateString("en-GB")}. Client may need to rebook.`,
      }).eq("id", bookingId);
      if (failApptErr) {
        console.error("[webhook] failed payment appointment update error:", failApptErr.message);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
      }
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
        // current_period_end varies by Stripe SDK version — use unknown cast for safety
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

  // ── Stripe Connect Events ────────────────────────────────────

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    await supabase.from("salons").update({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    }).eq("stripe_account_id", account.id);
    console.log(`[Webhook] account.updated id=${account.id} charges=${account.charges_enabled} payouts=${account.payouts_enabled}`);
  }

  if (event.type === "payout.paid") {
    const payout = event.data.object as Stripe.Payout;
    console.log(`[Webhook] payout.paid id=${payout.id} amount=${payout.amount / 100}`);
  }

  if (event.type === "payout.failed") {
    const payout = event.data.object as Stripe.Payout;
    console.log(`[Webhook] payout.failed id=${payout.id} reason=${payout.failure_message}`);
  }

  return NextResponse.json({ received: true });
}