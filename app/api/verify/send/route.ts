import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createHmac } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || "noreply@featuresalon.co.uk";

// In-memory rate limiter: max 3 OTP sends per IP per 5 minutes (preserved from SMS version)
const ipRateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

// 10-minute window — stateless, no DB required
function getWindow(): number {
  return Math.floor(Date.now() / (10 * 60 * 1000));
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signCode(email: string, code: string, window: number): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret";
  return createHmac("sha256", secret)
    .update(`${email}:${code}:${window}`)
    .digest("hex");
}

function buildOtpEmail(code: string, email: string): string {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:32px auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#5B21B6 0%,#7C3AED 100%);padding:32px 28px;text-align:center;">
      <p style="color:rgba(255,255,255,0.7);margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Feature</p>
      <h1 style="color:#fff;margin:8px 0 0;font-size:22px;font-weight:700;">Booking Verification</h1>
    </div>
    <div style="background:#fff;padding:32px 28px;text-align:center;">
      <p style="font-size:15px;color:#334155;margin:0 0 8px;">Your verification code is:</p>
      <div style="display:inline-block;background:linear-gradient(135deg,#F5F3FF,#EDE9FE);border:2px solid #DDD6FE;border-radius:14px;padding:20px 40px;margin:16px 0 24px;">
        <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#5B21B6;font-family:'Courier New',monospace;">${code}</div>
      </div>
      <p style="font-size:13px;color:#64748B;margin:0 0 6px;">This code expires in <strong>10 minutes</strong>.</p>
      <p style="font-size:13px;color:#64748B;margin:0 0 24px;">If you did not request this, you can safely ignore this email.</p>
      <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:12px 16px;text-align:left;">
        <div style="font-size:12px;color:#92400E;line-height:1.6;">
          <strong>Security notice:</strong> Feature staff will never ask for this code. Do not share it with anyone.
        </div>
      </div>
    </div>
    <div style="background:#F9F9F9;border-top:1px solid #EFEFEF;padding:16px 28px;text-align:center;">
      <p style="font-size:12px;color:#bbb;margin:0;line-height:1.8;">
        Sent to ${email} &bull; Feature &bull; United Kingdom<br/>
        This is an automated security email &mdash; do not reply.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait 5 minutes before trying again." },
        { status: 429 }
      );
    }

    const { email } = await request.json();
    if (!email || !String(email).includes("@")) {
      return NextResponse.json({ error: "Valid email address required" }, { status: 400 });
    }

    const emailNorm = String(email).toLowerCase().trim();
    const code = generateOtp();
    const window = getWindow();
    const challenge = signCode(emailNorm, code, window);

    const { error: emailError } = await resend.emails.send({
      from: FROM,
      to: emailNorm,
      subject: `${code} is your Feature booking verification code`,
      html: buildOtpEmail(code, emailNorm),
    });

    if (emailError) {
      console.error("[verify/send] Resend error:", JSON.stringify(emailError));
      return NextResponse.json(
        { error: "Could not send verification email. Please check your email address and try again." },
        { status: 500 }
      );
    }

    console.log(`[verify/send] OTP emailed to ${emailNorm}`);
    return NextResponse.json({ success: true, challenge });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[verify/send]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
