import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─────────────────────────────────────────────────────────────
// POST /api/admin/invites/accept
// Public endpoint — called by the invite acceptance page.
// Body: { token, fullName, password }
// Creates a Supabase auth user, adds them to admin_users,
// marks the invite as accepted.
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { token, fullName, password } = await req.json().catch(() => ({}));

  // ── Basic validation ───────────────────────────────────────
  if (!token || typeof token !== "string" || token.length !== 64) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 400 });
  }
  if (!fullName?.trim()) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // ── Fetch and validate the invite ─────────────────────────
  const { data: invite, error: invErr } = await supabaseAdmin
    .from("admin_invites")
    .select("id, email, role, status, expires_at")
    .eq("token", token)
    .single();

  if (invErr || !invite) {
    return NextResponse.json({ error: "Invalid or expired invite link" }, { status: 400 });
  }
  if (invite.status !== "pending") {
    const reason = invite.status === "accepted" ? "already been used" : "been revoked";
    return NextResponse.json({ error: `This invite has ${reason}` }, { status: 400 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    await supabaseAdmin.from("admin_invites").update({ status: "expired" }).eq("id", invite.id);
    return NextResponse.json({ error: "This invite has expired. Ask for a new one." }, { status: 400 });
  }

  // ── Check email isn't already taken ───────────────────────
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const emailTaken = existingUsers?.users?.some(
    (u) => u.email?.toLowerCase() === invite.email.toLowerCase(),
  );
  if (emailTaken) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try logging in." },
      { status: 409 },
    );
  }

  // ── Create Supabase auth user ──────────────────────────────
  const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email:            invite.email,
    password,
    email_confirm:    true, // skip email confirmation — they clicked our invite link
    user_metadata:    { full_name: fullName.trim(), role: invite.role },
  });

  if (createErr || !newUser.user) {
    console.error("[invite/accept] createUser error:", createErr);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

  // ── Add to admin_users ─────────────────────────────────────
  const { error: adminUserErr } = await supabaseAdmin
    .from("admin_users")
    .insert({
      id:        newUser.user.id,
      role:      invite.role,
      full_name: fullName.trim(),
      email:     invite.email,
    });

  if (adminUserErr) {
    console.error("[invite/accept] admin_users insert error:", adminUserErr);
    // Rollback auth user to keep state clean
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: "Failed to set up admin access" }, { status: 500 });
  }

  // ── Mark invite as accepted ────────────────────────────────
  await supabaseAdmin
    .from("admin_invites")
    .update({
      status:       "accepted",
      accepted_at:  new Date().toISOString(),
      accepted_uid: newUser.user.id,
    })
    .eq("id", invite.id);

  console.log(`[invite/accept] ${invite.email} joined as ${invite.role}`);
  return NextResponse.json({ success: true, email: invite.email });
}
