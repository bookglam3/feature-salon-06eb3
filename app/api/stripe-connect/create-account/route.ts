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

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get salon
    const { data: salon } = await supabaseAdmin
      .from("salons")
      .select("id, name, stripe_account_id, charges_enabled")
      .eq("owner_id", user.id)
      .single();

    if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

    let accountId = salon.stripe_account_id;

    // Create Stripe Express account if not exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "GB",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: salon.name,
          mcc: "7230", // Beauty salons, barbers
          url: `${APP_URL}/book`,
        },
        settings: {
          payouts: {
            schedule: { interval: "daily" },
          },
        },
      });
      accountId = account.id;

      // Save to DB
      await supabaseAdmin
        .from("salons")
        .update({ stripe_account_id: accountId })
        .eq("id", salon.id);
    }

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/api/stripe-connect/refresh?salon_id=${salon.id}`,
      return_url:  `${APP_URL}/api/stripe-connect/return?salon_id=${salon.id}`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("[stripe-connect/create-account]", err);
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
