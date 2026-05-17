import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { salonId } = await req.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://featuresalon.co.uk";

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // service role needed to read across RLS
    );

    const { data: salon } = await supabase.from("salons").select("stripe_customer_id").eq("id", salonId).single();
    if (!salon?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found. Please subscribe first." }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: salon.stripe_customer_id,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[portal]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
