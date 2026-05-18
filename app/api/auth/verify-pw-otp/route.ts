import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Auth
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, newPassword } = await request.json();

    if (!code || !newPassword) {
      return NextResponse.json({ error: "Code and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Find valid OTP
    const { data: otpRow, error: fetchError } = await supabaseAdmin
      .from("password_change_otps")
      .select("*")
      .eq("user_id", user.id)
      .eq("code", code.trim())
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRow) {
      return NextResponse.json(
        { error: "Invalid or expired code. Please request a new one." },
        { status: 400 }
      );
    }

    // Mark OTP as used immediately (prevent replay)
    await supabaseAdmin
      .from("password_change_otps")
      .update({ used: true })
      .eq("id", otpRow.id);

    // Update password via admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("[verify-pw-otp] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }

    console.log(`[verify-pw-otp] ✅ Password changed for ${user.email}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-pw-otp] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
