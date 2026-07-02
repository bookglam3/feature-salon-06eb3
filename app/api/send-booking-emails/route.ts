import { NextRequest, NextResponse } from "next/server";
import { sendBookingEmails } from "@/app/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Internal-only: requires CRON_SECRET bearer token (same pattern as send-reminder)
  const cronSecret = process.env.CRON_SECRET;
  const bearer = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!cronSecret || !bearer || bearer !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      clientEmail,
      clientName,
      clientPhone,
      serviceName,
      dateTime,
      staffName,
      salonName,
      salonOwnerEmail,
      price,
      salonAddress,
      cancelLink,
      dashboardUrl,
      paymentStatus,
      depositOnly,
      businessType,
    } = await request.json();

    await sendBookingEmails({
      clientEmail,
      clientName,
      clientPhone:     clientPhone || "",
      serviceName,
      dateTime,
      staffName,
      salonName,
      salonOwnerEmail,
      price,
      salonAddress,
      cancelLink,
      dashboardUrl,
      paymentStatus,
      depositOnly,
      businessType,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending booking emails:", error);
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 });
  }
}
