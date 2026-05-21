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
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    const serviceId = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!serviceId) {
      return NextResponse.json({ error: "Verify service not configured" }, { status: 500 });
    }

    await client.verify.v2.services(serviceId).verifications.create({
      to: phone,
      channel: "sms",
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[verify/send]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
