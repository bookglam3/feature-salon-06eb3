import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  signAdminToken,
  ADMIN_COOKIE,
  adminCookieOptions,
} from "@/app/lib/adminAuth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─────────────────────────────────────────────────────────────
// POST /api/admin/auth  — Login (step 1)
// Body: { email, password }
// Returns:
//   { success, role, name, requires2fa: false }  → JWT set, go to /admin
//   { success, requires2fa: true  }              → JWT set (mfa_verified=false), go to /admin/login/verify
//   { success, requires_setup: true }            → JWT set (mfa_verified=false), go to /admin/setup-2fa
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  // 1. Verify credentials with Supabase Auth
  const { data: authData, error: authErr } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (authErr || !authData.user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // 2. Check admin role — must be active
  const { data: adminUser, error: adminErr } = await supabaseAdmin
    .from("admin_users")
    .select("id, role, full_name, is_active, totp_enabled")
    .eq("id", authData.user.id)
    .eq("is_active", true)
    .single();

  if (adminErr || !adminUser) {
    return NextResponse.json({ error: "This account does not have admin access" }, { status: 403 });
  }

  // 3. Update last login
  await supabaseAdmin.from("admin_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", adminUser.id);

  const mfa_setup_required = !adminUser.totp_enabled;

  // 4. Issue token (mfa_verified = false until 2FA is passed)
  const token = await signAdminToken({
    id:                 adminUser.id,
    role:               adminUser.role,
    mfa_verified:       false,
    mfa_setup_required,
  });

  const res = NextResponse.json({
    success:       true,
    role:          adminUser.role,
    name:          adminUser.full_name,
    requires2fa:   adminUser.totp_enabled,
    requires_setup: mfa_setup_required,
  });
  res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions);
  return res;
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/auth  — Logout
// ─────────────────────────────────────────────────────────────
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
