import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function signCode(email: string, code: string, window: number): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret";
  return createHmac("sha256", secret)
    .update(`${email}:${code}:${window}`)
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
    const { email, code, challenge } = await request.json();
    if (!email || !code || !challenge) {
      return NextResponse.json({ error: "Email, code, and challenge required" }, { status: 400 });
    }

    const emailNorm = String(email).toLowerCase().trim();
    const currentWindow = getWindow();
    // Accept current window and previous — handles codes sent near a 10-min boundary
    const validWindows = [currentWindow, currentWindow - 1];

    const isValid = validWindows.some(w => {
      const expected = signCode(emailNorm, String(code).trim(), w);
      return safeCompare(expected, String(challenge));
    });

    if (!isValid) {
      return NextResponse.json({ error: "Incorrect or expired code. Please try again." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[verify/check]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
