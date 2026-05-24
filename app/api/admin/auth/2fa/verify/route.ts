import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest, signAdminToken, ADMIN_COOKIE, adminCookieOptions } from "@/app/lib/adminAuth";
import { verifyTOTP, matchBackupCode } from "@/app/lib/totp";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─────────────────────────────────────────────────────────────
// POST /api/admin/auth/2fa/verify
// Body: { code }  — TOTP code OR backup code
// Validates code, re-issues JWT with mfa_verified=true.
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

  if (!adminUser?.totp_enabled || !adminUser.totp_secret) {
    return NextResponse.json({ error: "2FA not set up" }, { status: 400 });
  }

  let verified = false;

  // ── Try TOTP code first ────────────────────────────────────
  if (/^\d{6}$/.test(code.replace(/\s/g, ""))) {
    verified = verifyTOTP(adminUser.totp_secret, code);
  }

  // ── Try backup code if TOTP failed ────────────────────────
  if (!verified) {
    const { data: backupRows } = await supabaseAdmin
      .from("admin_backup_codes")
      .select("id, code_hash")
      .eq("admin_id", admin.id)
      .eq("used", false);

    const hashes = (backupRows ?? []).map(r => r.code_hash);
    const idx    = matchBackupCode(code, hashes);

    if (idx !== -1 && backupRows) {
      const usedId = backupRows[idx].id;
      await supabaseAdmin.from("admin_backup_codes")
        .update({ used: true, used_at: new Date().toISOString() })
        .eq("id", usedId);
      verified = true;
    }
  }

  if (!verified) {
    return NextResponse.json({ error: "Invalid code. Try again or use a backup code." }, { status: 400 });
  }

  // Re-issue JWT with mfa_verified = true
  const token = await signAdminToken({
    id:                admin.id,
    role:              adminUser.role,
    mfa_verified:      true,
    mfa_setup_required: false,
  });

  const res = NextResponse.json({ success: true, role: adminUser.role });
  res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions);
  return res;
}
