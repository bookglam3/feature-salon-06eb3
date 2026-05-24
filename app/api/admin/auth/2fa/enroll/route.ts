import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { verifyAdminRequest } from "@/app/lib/adminAuth";
import { generateTOTPSecret, totpURI, generateBackupCodes } from "@/app/lib/totp";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─────────────────────────────────────────────────────────────
// GET /api/admin/auth/2fa/enroll
// Generates a new TOTP secret + QR code + backup codes.
// Does NOT save to DB yet — saving happens on /confirm.
// Requires valid JWT (any mfa_verified state).
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Fetch email for the QR code label
  const { data: adminUser } = await supabaseAdmin
    .from("admin_users")
    .select("email, totp_enabled")
    .eq("id", admin.id)
    .single();

  if (!adminUser) return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  if (adminUser.totp_enabled) return NextResponse.json({ error: "2FA already enrolled" }, { status: 409 });

  const secret = generateTOTPSecret();
  const uri    = totpURI(secret, adminUser.email);
  const qrPng  = await QRCode.toDataURL(uri, { width: 240, margin: 2, color: { dark: "#1a1a2e", light: "#ffffff" } });
  const { codes, hashes } = generateBackupCodes(8);

  // Temporarily store secret + backup hashes in the DB (pending confirmation)
  await supabaseAdmin.from("admin_users")
    .update({ totp_secret: `pending:${secret}:${hashes.join(",")}` })
    .eq("id", admin.id);

  return NextResponse.json({ qr: qrPng, secret, backupCodes: codes });
}
