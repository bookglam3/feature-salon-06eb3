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

// In-memory rate limiter — protects against burst brute-force within the same serverless instance
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT    = 5;
const RATE_WINDOW   = 15 * 60 * 1000; // 15 minutes in ms

function isRateLimited(ip: string): boolean {
  const now   = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

// ─────────────────────────────────────────────────────────────
// POST /api/admin/auth  — Login (step 1)
// Body: { email, password }
// Returns:
//   { success, role, name, requires2fa: false }  → JWT set, go to /admin
//   { success, requires2fa: true  }              → JWT set (mfa_verified=false), go to /admin/login/verify
//   { success, requires_setup: true }            → JWT set (mfa_verified=false), go to /admin/setup-2fa
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in 15 minutes." },
      { status: 429, headers: { "Retry-After": "900" } },
    );
  }

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
    .select("id, role, full_name, is_active, totp_enabled, demo_enabled, demo_expires_at")
    .eq("id", authData.user.id)
    .eq("is_active", true)
    .single();

  if (adminErr || !adminUser) {
    return NextResponse.json({ error: "This account does not have admin access" }, { status: 403 });
  }

  // 3. Guest: check demo access is enabled
  if (adminUser.role === "guest") {
    if (!adminUser.demo_enabled) {
      return NextResponse.json({ error: "Demo access has been disabled." }, { status: 403 });
    }
    const expiresAt = adminUser.demo_expires_at
      ? Math.floor(new Date(adminUser.demo_expires_at).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 24 * 60 * 60;

    if (expiresAt < Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ error: "Demo session has expired. Contact the administrator." }, { status: 403 });
    }

    await supabaseAdmin.from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", adminUser.id);

    const TTL_24H = 24 * 60 * 60;
    const token = await signAdminToken(
      { id: adminUser.id, role: adminUser.role, mfa_verified: true, mfa_setup_required: false, demo_expires_at: expiresAt },
      TTL_24H,
    );
    const res = NextResponse.json({ success: true, role: adminUser.role, name: adminUser.full_name });
    res.cookies.set(ADMIN_COOKIE, token, { ...adminCookieOptions, maxAge: TTL_24H });
    return res;
  }

  // 4. Update last login
  await supabaseAdmin.from("admin_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", adminUser.id);

  // 5. Issue token — 2FA bypassed, direct access
  const token = await signAdminToken({
    id:                 adminUser.id,
    role:               adminUser.role,
    mfa_verified:       true,
    mfa_setup_required: false,
  });

  const res = NextResponse.json({
    success: true,
    role:    adminUser.role,
    name:    adminUser.full_name,
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
