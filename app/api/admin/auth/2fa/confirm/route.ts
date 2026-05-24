import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest, signAdminToken, ADMIN_COOKIE, adminCookieOptions } from "@/app/lib/adminAuth";
import { verifyTOTP } from "@/app/lib/totp";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─────────────────────────────────────────────────────────────
// POST /api/admin/auth/2fa/confirm
// Body: { code }
// Verifies the first TOTP code, finalises enrollment,
// stores backup code hashes, re-issues JWT with mfa_verified=true.
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { code } = await req.json().catch(() => ({}));
  if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

  const { data: adminUser } = await supabaseAdmin
    .from("admin_users")
    .select("role, totp_secret, totp_enabled")
    .eq("id", admin.id)
    .single();

  if (!adminUser) return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  if (adminUser.totp_enabled) return NextResponse.json({ error: "2FA already active" }, { status: 409 });

  // Parse the pending secret stored during enroll
  const raw = adminUser.totp_secret ?? "";
  if (!raw.startsWith("pending:")) {
    return NextResponse.json({ error: "No pending 2FA setup found. Restart enrollment." }, { status: 400 });
  }
  const parts = raw.slice("pending:".length).split(":");
  const secret = parts[0];
  const hashes = parts[1]?.split(",") ?? [];

  if (!verifyTOTP(secret, code)) {
    return NextResponse.json({ error: "Incorrect code. Check your authenticator and try again." }, { status: 400 });
  }

  // Save secret + backup hashes + enable 2FA
  await supabaseAdmin.from("admin_users").update({
    totp_secret:      secret,
    totp_enabled:     true,
    totp_enrolled_at: new Date().toISOString(),
  }).eq("id", admin.id);

  // Store backup code hashes
  await supabaseAdmin.from("admin_backup_codes").delete().eq("admin_id", admin.id);
  await supabaseAdmin.from("admin_backup_codes").insert(
    hashes.map((h: string) => ({ admin_id: admin.id, code_hash: h }))
  );

  // Re-issue JWT with mfa_verified = true
  const token = await signAdminToken({
    id:                admin.id,
    role:              adminUser.role,
    mfa_verified:      true,
    mfa_setup_required: false,
  });

  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions);
  return res;
}
