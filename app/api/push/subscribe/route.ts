import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { subscription, salon_id } = body as {
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
    salon_id: string;
  };

  if (
    !subscription?.endpoint ||
    !subscription?.keys?.p256dh ||
    !subscription?.keys?.auth ||
    !salon_id
  ) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // Verify the salon belongs to this user before writing
  const { data: salon } = await supabaseAdmin
    .from("salons")
    .select("id")
    .eq("id", salon_id)
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .upsert(
      {
        user_id:  user.id,
        salon_id: salon.id,
        endpoint: subscription.endpoint,
        p256dh:   subscription.keys.p256dh,
        auth:     subscription.keys.auth,
      },
      { onConflict: "endpoint" }
    );

  if (error) return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  return NextResponse.json({ success: true });
}
