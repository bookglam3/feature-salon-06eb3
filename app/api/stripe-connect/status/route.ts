import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: salon } = await supabaseAdmin
      .from("salons")
      .select("id, stripe_account_id, charges_enabled, payouts_enabled, connect_onboarded_at")
      .eq("owner_id", user.id)
      .single();

    if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

    // No account yet
    if (!salon.stripe_account_id) {
      return NextResponse.json({ connected: false, charges_enabled: false, payouts_enabled: false });
    }

    // Fetch live balance + account data
    const stripeOpts = { stripeAccount: salon.stripe_account_id };
    const [account, balance] = await Promise.all([
      stripe.accounts.retrieve(salon.stripe_account_id),
      stripe.balance.retrieve({}, stripeOpts),
    ]);

    // Sync status in DB if changed
    if (account.charges_enabled !== salon.charges_enabled || account.payouts_enabled !== salon.payouts_enabled) {
      await supabaseAdmin.from("salons").update({
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      }).eq("id", salon.id);
    }

    // Get recent payouts
    const payouts = await stripe.payouts.list({ limit: 10 }, stripeOpts);

    return NextResponse.json({
      connected: true,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      onboarded_at: salon.connect_onboarded_at,
      balance: {
        available: balance.available.map(b => ({ amount: b.amount / 100, currency: b.currency })),
        pending:   balance.pending.map(b => ({ amount: b.amount / 100, currency: b.currency })),
      },
      payouts: payouts.data.map(p => ({
        id:           p.id,
        amount:       p.amount / 100,
        currency:     p.currency,
        status:       p.status,
        arrival_date: p.arrival_date,
        created:      p.created,
        description:  p.description,
      })),
    });
  } catch (err) {
    console.error("[stripe-connect/status]", err);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
