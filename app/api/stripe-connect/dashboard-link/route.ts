import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Returns a login link to Stripe Express dashboard
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: salon } = await supabaseAdmin
      .from("salons")
      .select("stripe_account_id, charges_enabled")
      .eq("owner_id", user.id)
      .single();

    if (!salon?.stripe_account_id) {
      return NextResponse.json({ error: "No connected account" }, { status: 400 });
    }

    const loginLink = await stripe.accounts.createLoginLink(salon.stripe_account_id);
    return NextResponse.json({ url: loginLink.url });
  } catch (err) {
    console.error("[stripe-connect/dashboard-link]", err);
    return NextResponse.json({ error: "Failed to create dashboard link" }, { status: 500 });
  }
}
