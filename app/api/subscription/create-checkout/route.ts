import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
export const dynamic = "force-dynamic";

const PRICE_MAP: Record<string, string> = {
  starter:  process.env.STRIPE_STARTER_PRICE_ID  || "",
  pro:      process.env.STRIPE_PRO_PRICE_ID       || "",
  business: process.env.STRIPE_BUSINESS_PRICE_ID  || "",
};

export async function POST(req: NextRequest) {
  try {
    const { plan, salonId, email, salonName } = await req.json();
    if (!plan || !salonId) return NextResponse.json({ error: "Missing plan or salonId" }, { status: 400 });

    const priceId = PRICE_MAP[plan];
    if (!priceId) return NextResponse.json({ error: "Invalid plan: " + plan }, { status: 400 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://featuresalon.co.uk";

    // Get or create Stripe customer
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: salon } = await supabase.from("salons").select("stripe_customer_id").eq("id", salonId).single();

    let customerId = salon?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email || undefined,
        name: salonName || undefined,
        metadata: { salon_id: salonId },
      });
      customerId = customer.id;
      await supabase.from("salons").update({ stripe_customer_id: customerId }).eq("id", salonId);
    }

    // Create Checkout Session with 14-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { salon_id: salonId, plan },
      },
      success_url: `${appUrl}/dashboard?subscription=success&plan=${plan}`,
      cancel_url:  `${appUrl}/subscribe?cancelled=true`,
      metadata: { salon_id: salonId, plan },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[create-checkout]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
