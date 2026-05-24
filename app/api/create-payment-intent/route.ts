import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || "5") / 100;

export async function POST(req: NextRequest) {
  try {
    const {
      amount, charge_amount, email, booking_id,
      salon_name, service_name, deposit_only, salon_id,
    } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    const rawAmount = charge_amount ?? amount;
    if (!rawAmount || isNaN(Number(rawAmount)) || Number(rawAmount) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const chargeAmount = charge_amount
      ? Math.round(charge_amount * 100)
      : deposit_only ? Math.round(amount * 0.5 * 100) : Math.round(amount * 100);

    // Check if salon has a connected Stripe account
    let stripeAccountId: string | null = null;
    if (salon_id) {
      const { data: salon } = await supabaseAdmin
        .from("salons")
        .select("stripe_account_id, charges_enabled")
        .eq("id", salon_id)
        .single();
      if (salon?.stripe_account_id && salon?.charges_enabled) {
        stripeAccountId = salon.stripe_account_id;
      }
    }

    const platformFee = stripeAccountId ? Math.round(chargeAmount * PLATFORM_FEE_PERCENT) : undefined;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: "gbp",
      receipt_email: email,
      description: `${salon_name || "Salon"} – ${service_name || "Appointment"}${deposit_only ? " (50% Deposit)" : ""}`,
      metadata: {
        booking_id:    booking_id || "",
        salon_name:    salon_name || "",
        service_name:  service_name || "",
        deposit_only:  deposit_only ? "true" : "false",
        full_amount:   String(Math.round(amount * 100)),
        salon_id:      salon_id || "",
      },
      // Destination charge — routes payment to salon's Stripe account
      ...(stripeAccountId && {
        transfer_data:        { destination: stripeAccountId },
        application_fee_amount: platformFee,
      }),
    });

    return NextResponse.json({
      clientSecret:     paymentIntent.client_secret,
      paymentIntentId:  paymentIntent.id,
      chargeAmount,
      platformFee:      platformFee ? platformFee / 100 : 0,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}