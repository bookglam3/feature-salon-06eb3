import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { amount, charge_amount, email, booking_id, salon_name, service_name, deposit_only } = await req.json();

    if (!amount || !email) {
      return NextResponse.json({ error: "Missing amount or email" }, { status: 400 });
    }

    // charge_amount is the exact amount to charge (supports any deposit %)
    // Falls back to 50% if deposit_only is set but no charge_amount given
    const chargeAmount = charge_amount
      ? Math.round(charge_amount * 100)
      : deposit_only ? Math.round(amount * 0.5 * 100) : Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: "gbp",
      receipt_email: email,
      description: `${salon_name || "Salon"} – ${service_name || "Appointment"}${deposit_only ? " (50% Deposit)" : ""}`,
      metadata: {
        booking_id: booking_id || "",
        salon_name: salon_name || "",
        service_name: service_name || "",
        deposit_only: deposit_only ? "true" : "false",
        full_amount: String(Math.round(amount * 100)),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      chargeAmount,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}