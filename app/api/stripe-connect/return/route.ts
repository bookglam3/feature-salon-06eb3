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

// Called by Stripe after onboarding completes
export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.redirect(`${APP_URL}/dashboard/earnings?error=missing_salon`);

  try {
    const { data: salon } = await supabaseAdmin
      .from("salons")
      .select("stripe_account_id")
      .eq("id", salonId)
      .single();

    if (!salon?.stripe_account_id) {
      return NextResponse.redirect(`${APP_URL}/dashboard/earnings?error=no_account`);
    }

    // Fetch live account status from Stripe
    const account = await stripe.accounts.retrieve(salon.stripe_account_id);

    // Update DB with current status
    await supabaseAdmin.from("salons").update({
      charges_enabled:      account.charges_enabled,
      payouts_enabled:      account.payouts_enabled,
      connect_onboarded_at: new Date().toISOString(),
    }).eq("id", salonId);

    return NextResponse.redirect(`${APP_URL}/dashboard/earnings?connected=true`);
  } catch (err) {
    console.error("[stripe-connect/return]", err);
    return NextResponse.redirect(`${APP_URL}/dashboard/earnings?error=stripe_error`);
  }
}
