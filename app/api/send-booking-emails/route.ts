import { NextRequest, NextResponse } from "next/server";
import { sendBookingEmails } from "@/app/lib/email";

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
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending booking emails:", error);
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 });
  }
}