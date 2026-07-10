import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDefaultServices } from "@/app/lib/defaultServices";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// POST /api/signup/complete
// Called after the client successfully verifies the email OTP.
// The access token proves email ownership — we trust it via supabaseAdmin.auth.getUser.
// This route sets the user's password, creates their salon, and seeds default services.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { accessToken, fullName, password, salonName, phone, company, category } = body;

  if (!accessToken || !String(salonName || "").trim() || !password) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // Verify the access token — supabaseAdmin.auth.getUser validates the JWT cryptographically.
  // This is the server-side proof that the client successfully verified their email OTP.
  const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
  if (userErr || !user) {
    return NextResponse.json(
      { error: "Session is invalid or expired. Please restart the verification." },
      { status: 401 },
    );
  }

  // Idempotent: if a salon already exists for this user, signup completed successfully
  // on a prior attempt (or this is an existing account). Return success either way.
  const { data: existingSalon } = await supabaseAdmin
    .from("salons")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existingSalon) {
    return NextResponse.json({ ok: true });
  }

  // Set password + display name. OTP signup creates a passwordless user; we add
  // the password here so they can sign in normally from the login page.
  const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: String(password),
    user_metadata: {
      full_name:     String(fullName || "").trim(),
      salon_name:    String(salonName).trim(),
      business_type: category || "hair",
    },
  });
  if (updateErr) {
    return NextResponse.json({ error: "Failed to set account password. Please try again." }, { status: 500 });
  }

  // Generate a unique slug
  const baseSlug = String(salonName).trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  let slug = baseSlug;
  let attempt = 0;
  while (true) {
    const { data: ex } = await supabaseAdmin.from("salons").select("id").eq("slug", slug).maybeSingle();
    if (!ex) break;
    slug = `${baseSlug}-${++attempt}`;
  }

  // Create the salon record
  const { data: newSalon, error: salonErr } = await supabaseAdmin
    .from("salons")
    .insert({
      name:          String(salonName).trim(),
      slug,
      owner_id:      user.id,
      owner_email:   user.email,
      plan:          "starter",
      business_type: category || "hair",
    })
    .select("id")
    .single();

  if (salonErr || !newSalon) {
    return NextResponse.json(
      { error: "Failed to create salon. Please try again." },
      { status: 500 },
    );
  }

  // Seed vertical-appropriate default services (non-fatal)
  try {
    const defaults = getDefaultServices(category || "hair");
    if (defaults.length > 0) {
      await supabaseAdmin.from("services").insert(
        defaults.map(svc => ({ salon_id: newSalon.id, ...svc })),
      );
    }
  } catch { /* non-fatal — salon is still created */ }

  return NextResponse.json({ ok: true });
}
