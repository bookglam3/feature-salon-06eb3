import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAIL = "adilgill2008@gmail.com";

// Helper: verify admin JWT + enforce admin-only email
async function verifyAdmin(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
  if (!token) return null;
  const { data: { user }, error } = await adminSupabase.auth.getUser(token);
  if (error || !user) return null;
  if (user.email !== ADMIN_EMAIL) return null;
  return user;
}

// Generate a unique referral code  e.g. AGT-X7K2M9
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "AGT-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── GET — list all agents (admin only)
export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = adminSupabase
    .from("sales_agents")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[/api/partners] GET failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ agents: data });
}

// ── POST — submit a new application (public)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    full_name, phone, whatsapp, city, experience, own_vehicle,
    daily_availability, why_hire,
    // Identity verification fields
    id_card_number, id_issue_date, id_expiry_date,
    id_card_photo_url, selfie_photo_url,
    street_address, postcode, country,
  } = body;

  if (!full_name?.trim())          return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  if (!phone?.trim())              return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  if (!city?.trim())               return NextResponse.json({ error: "City is required" }, { status: 400 });
  if (!street_address?.trim())     return NextResponse.json({ error: "Street address is required" }, { status: 400 });
  if (!postcode?.trim())           return NextResponse.json({ error: "Postcode is required" }, { status: 400 });
  if (!experience?.trim())         return NextResponse.json({ error: "Experience is required" }, { status: 400 });
  if (!daily_availability?.trim()) return NextResponse.json({ error: "Availability is required" }, { status: 400 });
  if (!why_hire?.trim())           return NextResponse.json({ error: "Please tell us why you want to join" }, { status: 400 });
  if (!id_card_number?.trim())     return NextResponse.json({ error: "ID card number is required" }, { status: 400 });
  if (!id_issue_date)              return NextResponse.json({ error: "ID issue date is required" }, { status: 400 });
  if (!id_expiry_date)             return NextResponse.json({ error: "ID expiry date is required" }, { status: 400 });
  if (!id_card_photo_url)          return NextResponse.json({ error: "ID card photo is required" }, { status: 400 });
  if (!selfie_photo_url)           return NextResponse.json({ error: "Your photo is required" }, { status: 400 });

  const { data, error } = await adminSupabase
    .from("sales_agents")
    .insert({
      full_name: full_name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp?.trim() || null,
      city: city.trim(),
      experience: experience.trim(),
      own_vehicle: !!own_vehicle,
      daily_availability: daily_availability.trim(),
      why_hire: why_hire.trim(),
      // Address
      street_address: street_address.trim(),
      postcode: postcode.trim().toUpperCase(),
      country: country || "GB",
      // Identity
      id_card_number: id_card_number.trim(),
      id_issue_date: id_issue_date,
      id_expiry_date: id_expiry_date,
      id_card_photo_url: id_card_photo_url,
      selfie_photo_url: selfie_photo_url,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("[/api/partners] POST insert failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ agent: data });
}

// ── PATCH — approve/reject + add notes (admin only)
export async function PATCH(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { id, status, admin_notes } = body;

  if (!id) return NextResponse.json({ error: "Agent ID required" }, { status: 400 });
  if (!["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    status,
    admin_notes: admin_notes || null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.email || user.id,
  };

  // Generate referral code on approval (only if not already set)
  let referralCode: string | null = null;
  if (status === "approved") {
    const { data: existing } = await adminSupabase
      .from("sales_agents")
      .select("referral_code")
      .eq("id", id)
      .single();

    if (!existing?.referral_code) {
      let code = generateCode();
      let attempts = 0;
      while (attempts < 5) {
        const { data: clash } = await adminSupabase
          .from("sales_agents")
          .select("id")
          .eq("referral_code", code)
          .maybeSingle();
        if (!clash) break;
        code = generateCode();
        attempts++;
      }
      updatePayload.referral_code = code;
      referralCode = code;
    } else {
      referralCode = existing.referral_code;
    }
  }

  const { data, error } = await adminSupabase
    .from("sales_agents")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[/api/partners] PATCH failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── Send WhatsApp notification to applicant ──────────────────
  try {
    const agentPhone = data.whatsapp || data.phone;
    const agentName  = data.full_name?.split(" ")[0] || "there";
    const appUrl     = process.env.NEXT_PUBLIC_APP_URL || "https://featuresalon.co.uk";

    if (agentPhone) {
      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      );
      const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

      // Normalize phone to E.164
      let to = agentPhone.trim().replace(/\s+/g, "");
      if (!to.startsWith("+")) to = "+" + to;

      let messageBody = "";

      if (status === "approved") {
        messageBody =
          `🎉 Congratulations ${agentName}!\n\n` +
          `Your Feature Salon Partner application has been *APPROVED*! ✅\n\n` +
          `Your unique referral code is:\n` +
          `*${referralCode}*\n\n` +
          `Share this signup link with salons:\n` +
          `${appUrl}/signup?ref=${referralCode}\n\n` +
          `Every salon that signs up via your link earns you commission. 💰\n\n` +
          `Our team will be in touch shortly with next steps.\n\n` +
          `— Feature Salon Team 🌟`;
      } else if (status === "rejected") {
        messageBody =
          `Hi ${agentName},\n\n` +
          `Thank you for applying to become a Feature Salon Partner.\n\n` +
          `After careful review, we are unable to proceed with your application at this time.` +
          (admin_notes ? `\n\nFeedback: ${admin_notes}` : "") +
          `\n\nYou're welcome to reapply in the future as our requirements evolve.\n\n` +
          `— Feature Salon Team`;
      }

      if (messageBody) {
        await twilioClient.messages.create({
          from,
          to: `whatsapp:${to}`,
          body: messageBody,
        });
        console.log(`[/api/partners] WhatsApp sent to ${to} — status: ${status}`);
      }
    }
  } catch (notifErr) {
    // Don't fail the request if notification fails
    console.error("[/api/partners] WhatsApp notification failed:", notifErr);
  }

  return NextResponse.json({ agent: data });
}
