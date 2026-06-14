import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function signCode(userId: string, code: string, window: number): string {
  const secret = process.env.OTP_SECRET;
  if (!secret) throw new Error("OTP_SECRET is not configured");
  return createHmac("sha256", secret)
    .update(`${userId}:${code}:${window}`)
    .digest("hex");
}

function getWindow(): number {
  return Math.floor(Date.now() / (10 * 60 * 1000));
}

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, challenge, newPassword } = await request.json();

    if (!code || !challenge || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Verify HMAC for current window and previous window (grace period)
    const currentWindow = getWindow();
    const validWindows = [currentWindow, currentWindow - 1]; // allow up to ~20 min

    const isValid = validWindows.some(w => {
      const expected = signCode(user.id, code.trim(), w);
      return safeCompare(expected, challenge);
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired code. Please request a new one." },
        { status: 400 }
      );
    }

    // Update password via admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("[verify-pw-otp] Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`[verify-pw-otp] ✅ Password changed for ${user.email}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-pw-otp] Unexpected error:", err);
    return NextResponse.json({ error: `Server error: ${String(err)}` }, { status: 500 });
  }
}
