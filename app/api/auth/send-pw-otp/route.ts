import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || "noreply@featuresalon.co.uk";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildOtpEmail(code: string, email: string) {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#5B21B6 0%,#7C3AED 100%);padding:32px 28px;text-align:center;">
      <p style="color:rgba(255,255,255,0.7);margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Feature Salon</p>
      <h1 style="color:#fff;margin:8px 0 0;font-size:22px;font-weight:700;">Password Change Request</h1>
    </div>

    <!-- Body -->
    <div style="background:#fff;padding:32px 28px;text-align:center;">
      <p style="font-size:15px;color:#334155;margin:0 0 8px;">Your verification code is:</p>

      <!-- OTP Code -->
      <div style="display:inline-block;background:linear-gradient(135deg,#F5F3FF,#EDE9FE);border:2px solid #DDD6FE;border-radius:14px;padding:20px 40px;margin:16px 0 24px;">
        <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#5B21B6;font-family:'Courier New',monospace;">${code}</div>
      </div>

      <p style="font-size:13px;color:#64748B;margin:0 0 6px;">This code expires in <strong>10 minutes</strong>.</p>
      <p style="font-size:13px;color:#64748B;margin:0 0 24px;">If you did not request a password change, please ignore this email — your account is safe.</p>

      <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:12px 16px;text-align:left;">
        <div style="font-size:12px;color:#92400E;line-height:1.6;">
          <strong>⚠️ Security notice:</strong> Feature staff will never ask for this code. Do not share it with anyone.
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#F9F9F9;border-top:1px solid #EFEFEF;padding:16px 28px;text-align:center;">
      <p style="font-size:12px;color:#bbb;margin:0;line-height:1.8;">
        Sent to ${email} &bull; Feature Salon Management &bull; United Kingdom<br/>
        This is an automated security email — do not reply.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Bearer token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: max 3 OTPs per user in the last 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("password_change_otps")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", fifteenMinsAgo);

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: "Too many requests. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    // Invalidate any existing unused OTPs for this user
    await supabaseAdmin
      .from("password_change_otps")
      .update({ used: true })
      .eq("user_id", user.id)
      .eq("used", false);

    // Generate new OTP
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // Store in DB
    const { error: insertError } = await supabaseAdmin
      .from("password_change_otps")
      .insert({ user_id: user.id, code, expires_at: expiresAt });

    if (insertError) {
      console.error("[pw-otp] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to generate code" }, { status: 500 });
    }

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: FROM,
      to: user.email!,
      subject: "🔐 Your Feature password change code",
      html: buildOtpEmail(code, user.email!),
    });

    if (emailError) {
      console.error("[pw-otp] Email error:", emailError);
      return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
    }

    console.log(`[pw-otp] ✅ OTP sent to ${user.email}`);
    return NextResponse.json({ success: true, email: user.email });
  } catch (err) {
    console.error("[pw-otp] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
