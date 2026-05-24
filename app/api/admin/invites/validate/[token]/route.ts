import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ROLE_LABELS } from "@/app/types/admin";
import type { AdminRole } from "@/app/types/admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─────────────────────────────────────────────────────────────
// GET /api/admin/invites/validate/[token]
// Public endpoint — validates an invite token before showing the
// signup form. Returns sanitised info (no DB ids in the response).
// ─────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || token.length !== 64) {
    return NextResponse.json({ valid: false, reason: "invalid" }, { status: 400 });
  }

  const { data: invite, error } = await supabaseAdmin
    .from("admin_invites")
    .select("id, email, role, status, expires_at, invited_by ( full_name )")
    .eq("token", token)
    .maybeSingle();

  if (error || !invite) {
    return NextResponse.json({ valid: false, reason: "invalid" });
  }

  if (invite.status === "accepted") {
    return NextResponse.json({ valid: false, reason: "already_used" });
  }
  if (invite.status === "revoked") {
    return NextResponse.json({ valid: false, reason: "revoked" });
  }
  if (invite.status === "expired" || new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  const invitedBy = (invite.invited_by as { full_name?: string } | null)?.full_name ?? "the admin team";

  return NextResponse.json({
    valid: true,
    email:      invite.email,
    role:       invite.role,
    roleLabel:  ROLE_LABELS[invite.role as AdminRole] ?? invite.role,
    invitedBy,
    expiresAt:  invite.expires_at,
  });
}
