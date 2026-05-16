import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://featuresalon.co.uk";

// Called when onboarding link expires — regenerates it
export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.redirect(`${APP_URL}/dashboard/earnings`);

  try {
    const { data: salon } = await supabaseAdmin
      .from("salons")
      .select("id, stripe_account_id")
      .eq("id", salonId)
      .single();

    if (!salon?.stripe_account_id) {
      return NextResponse.redirect(`${APP_URL}/dashboard/earnings`);
    }

    const accountLink = await stripe.accountLinks.create({
      account: salon.stripe_account_id,
      refresh_url: `${APP_URL}/api/stripe-connect/refresh?salon_id=${salonId}`,
      return_url:  `${APP_URL}/api/stripe-connect/return?salon_id=${salonId}`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url);
  } catch (err) {
    console.error("[stripe-connect/refresh]", err);
    return NextResponse.redirect(`${APP_URL}/dashboard/earnings?error=refresh_failed`);
  }
}
