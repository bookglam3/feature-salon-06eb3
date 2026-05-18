import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { createHmac } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || "noreply@featuresalon.co.uk";

// Stateless: sign code with HMAC so no DB table needed
function signCode(userId: string, code: string, window: number): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret";
  return createHmac("sha256", secret)
    .update(`${userId}:${code}:${window}`)
    .digest("hex");
}

// 10-minute window ID
function getWindow(): number {
  return Math.floor(Date.now() / (10 * 60 * 1000));
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildOtpEmail(code: string, email: string) {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#5B21B6 0%,#7C3AED 100%);padding:32px 28px;text-align:center;">
      <p style="color:rgba(255,255,255,0.7);margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Feature Salon</p>
      <h1 style="color:#fff;margin:8px 0 0;font-size:22px;font-weight:700;">Password Change Request</h1>
    </div>
    <div style="background:#fff;padding:32px 28px;text-align:center;">
      <p style="font-size:15px;color:#334155;margin:0 0 8px;">Your verification code is:</p>
      <div style="display:inline-block;background:linear-gradient(135deg,#F5F3FF,#EDE9FE);border:2px solid #DDD6FE;border-radius:14px;padding:20px 40px;margin:16px 0 24px;">
        <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#5B21B6;font-family:'Courier New',monospace;">${code}</div>
      </div>
      <p style="font-size:13px;color:#64748B;margin:0 0 6px;">This code expires in <strong>10 minutes</strong>.</p>
      <p style="font-size:13px;color:#64748B;margin:0 0 24px;">If you did not request a password change, ignore this email — your account is safe.</p>
      <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:12px 16px;text-align:left;">
        <div style="font-size:12px;color:#92400E;line-height:1.6;">
          <strong>⚠️ Security notice:</strong> Feature staff will never ask for this code. Do not share it with anyone.
        </div>
      </div>
    </div>
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
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate OTP + sign it (stateless — no DB table required)
    const code = generateOtp();
    const window = getWindow();
    const challenge = signCode(user.id, code, window);

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: FROM,
      to: user.email,
      subject: `${code} is your Feature verification code`,
      html: buildOtpEmail(code, user.email),
    });

    if (emailError) {
      console.error("[pw-otp] Resend error:", JSON.stringify(emailError));
      return NextResponse.json(
        { error: `Email delivery failed: ${JSON.stringify(emailError)}` },
        { status: 500 }
      );
    }

    console.log(`[pw-otp] ✅ OTP sent to ${user.email}`);
    // Return challenge token to client (stores in memory, used on verify)
    return NextResponse.json({ success: true, challenge, email: user.email });
  } catch (err) {
    console.error("[pw-otp] Unexpected error:", err);
    return NextResponse.json({ error: `Server error: ${String(err)}` }, { status: 500 });
  }
}
