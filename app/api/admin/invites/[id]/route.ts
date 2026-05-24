import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest } from "@/app/lib/adminAuth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/invites/[id]
// Revokes a pending invite OR deactivates an accepted admin user.
// Only super_admin may call this.
// ─────────────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (admin.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Fetch the invite to know its current status
  const { data: invite, error: fetchErr } = await supabaseAdmin
    .from("admin_invites")
    .select("id, status, accepted_uid, email")
    .eq("id", id)
    .single();

  if (fetchErr || !invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  // ── Pending invite — just revoke it ───────────────────────
  if (invite.status === "pending") {
    const { error } = await supabaseAdmin
      .from("admin_invites")
      .update({ status: "revoked" })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, action: "revoked" });
  }

  // ── Accepted invite — deactivate the admin user too ───────
  if (invite.status === "accepted" && invite.accepted_uid) {
    const { error } = await supabaseAdmin
      .from("admin_users")
      .update({ is_active: false })
      .eq("id", invite.accepted_uid);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Also update the invite row for audit trail
    await supabaseAdmin
      .from("admin_invites")
      .update({ status: "revoked" })
      .eq("id", id);

    return NextResponse.json({ success: true, action: "deactivated" });
  }

  return NextResponse.json({ error: "Invite is not revocable in its current state" }, { status: 400 });
}
