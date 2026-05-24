import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest } from "@/app/lib/adminAuth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/auth/2fa/reset/[adminId]
// Super Admin only — clears an employee's 2FA enrollment.
// The employee must re-enroll on next login.
// ─────────────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ adminId: string }> },
) {
  const caller = await verifyAdminRequest(req);
  if (!caller)                       return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (caller.role !== "super_admin") return NextResponse.json({ error: "Forbidden" },    { status: 403 });

  const { adminId } = await params;
  if (adminId === caller.id) {
    return NextResponse.json({ error: "You cannot reset your own 2FA here. Use the setup page." }, { status: 400 });
  }

  // Clear 2FA from admin_users
  const { error } = await supabaseAdmin.from("admin_users").update({
    totp_enabled:     false,
    totp_secret:      null,
    totp_enrolled_at: null,
  }).eq("id", adminId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Delete all backup codes
  await supabaseAdmin.from("admin_backup_codes").delete().eq("admin_id", adminId);

  return NextResponse.json({ success: true });
}
