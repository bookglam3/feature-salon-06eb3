import { NextRequest, NextResponse } from "next/server";
import { sendBookingEmails } from "@/app/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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
      // New fields
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
      clientPhone: clientPhone || "",
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