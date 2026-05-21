import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();
    if (!phone || !code) {
      return NextResponse.json({ error: "Phone and code required" }, { status: 400 });
    }

    const serviceId = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!serviceId) {
      return NextResponse.json({ error: "Verify service not configured" }, { status: 500 });
    }

    const result = await client.verify.v2.services(serviceId).verificationChecks.create({
      to: phone,
      code: code.trim(),
    });

    if (result.status === "approved") {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[verify/check]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
