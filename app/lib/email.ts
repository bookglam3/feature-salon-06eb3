import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || "onboarding@resend.dev";

// ─────────────────────────────────────────
// UK Date Formatter
// ─────────────────────────────────────────
function formatDate(dateTime: string) {
  const date = new Date(dateTime);
  return {
    formattedDate: date.toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }),
    formattedTime: date.toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit", hour12: false,
    }),
  };
}

// ─────────────────────────────────────────
// Shared Email Template
// ─────────────────────────────────────────
function emailTemplate({
  title, clientName, message, serviceName,
  formattedDate, formattedTime, staffName, salonName,
  color, price, extra,
}: {
  title: string; clientName: string; message: string;
  serviceName?: string; formattedDate?: string; formattedTime?: string;
  staffName?: string; salonName: string; color: string;
  price?: number; extra?: string;
}) {
  return `
  <!DOCTYPE html>
  <html lang="en-GB">
  <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
  <body style="margin:0;padding:0;background:#F4F4F5;">
    <div style="max-width:520px;margin:32px auto;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;border-radius:14px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,${color} 0%,#7B2D52 100%);padding:32px 28px;text-align:center;">
        <p style="color:rgba(255,255,255,0.7);margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;">${salonName}</p>
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:600;">${title}</h1>
      </div>

      <!-- Body -->
      <div style="background:#fff;padding:28px;">
        <p style="font-size:15px;margin:0 0 14px;color:#222;">Dear <strong>${clientName}</strong>,</p>
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 22px;">${message}</p>

        ${(formattedDate || serviceName) ? `
        <div style="background:#FDF5F8;border:1px solid #F0C4D4;border-radius:10px;padding:18px 20px;margin-bottom:22px;">
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            ${formattedDate ? `<tr><td style="color:#999;padding:6px 0;width:120px;">📅 Date</td><td style="font-weight:600;">${formattedDate}</td></tr>` : ""}
            ${formattedTime ? `<tr><td style="color:#999;padding:6px 0;">🕐 Time</td><td style="font-weight:600;">${formattedTime}</td></tr>` : ""}
            ${serviceName ? `<tr><td style="color:#999;padding:6px 0;">✂️ Service</td><td style="font-weight:600;">${serviceName}</td></tr>` : ""}
            ${staffName ? `<tr><td style="color:#999;padding:6px 0;">👩 Stylist</td><td style="font-weight:600;">${staffName}</td></tr>` : ""}
            ${price ? `<tr><td style="color:#999;padding:6px 0;">💷 Price</td><td style="font-weight:700;color:${color};">£${price}</td></tr>` : ""}
          </table>
        </div>` : ""}

        ${extra ?? ""}

        <p style="font-size:13px;color:#aaa;margin:16px 0 0;line-height:1.6;">
          If you need to reschedule or cancel, please contact us at your earliest convenience.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#F9F9F9;border-top:1px solid #EFEFEF;padding:16px 28px;text-align:center;">
        <p style="font-size:12px;color:#ccc;margin:0;line-height:1.7;">
          ${salonName} &bull; United Kingdom<br/>
          This is an automated message — please do not reply directly to this email.
        </p>
      </div>

    </div>
  </body>
  </html>`;
}

// ═══════════════════════════════════════════════
// 1. BOOKING CONFIRMATION
// ═══════════════════════════════════════════════
export async function sendBookingEmails({
  clientEmail, clientName, clientPhone, serviceName,
  dateTime, staffName, salonName, salonOwnerEmail, price,
}: {
  clientEmail: string; clientName: string; clientPhone: string;
  serviceName: string; dateTime: string; staffName?: string;
  salonName: string; salonOwnerEmail: string; price?: number;
}) {
  const { formattedDate, formattedTime } = formatDate(dateTime);
  await Promise.all([
    resend.emails.send({
      from: FROM, to: clientEmail,
      subject: `Booking Confirmed — ${salonName}`,
      html: emailTemplate({
        title: "Your Booking is Confirmed ✓", clientName,
        message: "Thank you for booking with us. Your appointment has been confirmed and we look forward to welcoming you.",
        serviceName, formattedDate, formattedTime, staffName, salonName, color: "#C2185B", price,
      }),
    }),
    resend.emails.send({
      from: FROM, to: salonOwnerEmail,
      subject: `New Booking — ${clientName} on ${formattedDate}`,
      html: emailTemplate({
        title: "New Booking Received", clientName,
        message: `A new appointment has been booked by <strong>${clientName}</strong>.<br/>Phone: ${clientPhone}`,
        serviceName, formattedDate, formattedTime, staffName, salonName, color: "#1565C0", price,
      }),
    }),
  ]);
}

// ═══════════════════════════════════════════════
// 2. REMINDER — 1 Day Before
// ═══════════════════════════════════════════════
export async function send24hReminder({
  to, clientName, serviceName, staffName, salonName, dateTime, price,
}: {
  to: string; clientName: string; serviceName: string;
  staffName?: string; salonName: string; dateTime: string; price?: number;
}) {
  const { formattedDate, formattedTime } = formatDate(dateTime);
  await resend.emails.send({
    from: FROM, to,
    subject: `Reminder: Your appointment tomorrow at ${formattedTime} — ${salonName}`,
    html: emailTemplate({
      title: "Appointment Reminder — Tomorrow ⏰", clientName,
      message: "This is a friendly reminder that you have an appointment with us <strong>tomorrow</strong>. We look forward to welcoming you.",
      serviceName, formattedDate, formattedTime, staffName, salonName, color: "#C2185B", price,
    }),
  });
}

// ═══════════════════════════════════════════════
// 3. REMINDER — 2 Hours Before
// ═══════════════════════════════════════════════
export async function send2hReminder({
  to, clientName, serviceName, staffName, salonName, dateTime, price,
}: {
  to: string; clientName: string; serviceName: string;
  staffName?: string; salonName: string; dateTime: string; price?: number;
}) {
  const { formattedDate, formattedTime } = formatDate(dateTime);
  await resend.emails.send({
    from: FROM, to,
    subject: `See you in 2 hours — ${salonName}`,
    html: emailTemplate({
      title: "See You Soon — 2 Hours to Go! 💅", clientName,
      message: "Just a quick reminder that your appointment is in <strong>2 hours</strong>. We are looking forward to seeing you shortly!",
      serviceName, formattedDate, formattedTime, staffName, salonName, color: "#C2185B", price,
    }),
  });
}

// ═══════════════════════════════════════════════
// 4. WIN-BACK — 6 Weeks After Last Visit
// ═══════════════════════════════════════════════
export async function sendWinbackEmail({
  to, clientName, salonName, lastServiceName, bookingLink,
}: {
  to: string; clientName: string; salonName: string;
  lastServiceName?: string; bookingLink: string;
}) {
  await resend.emails.send({
    from: FROM, to,
    subject: `We'd love to see you again — ${salonName}`,
    html: emailTemplate({
      title: "We Miss You! 💕", clientName,
      message: `It has been a little while since your last visit${lastServiceName ? ` for your <strong>${lastServiceName}</strong>` : ""}, and we would love to welcome you back. As a valued client, we are offering you an exclusive discount on your next appointment.`,
      salonName, color: "#C2185B",
      extra: `
        <div style="background:linear-gradient(135deg,#FDE8F0,#F3E8FD);border:1.5px solid #C2185B;border-radius:12px;padding:22px;margin-bottom:20px;text-align:center;">
          <p style="font-size:11px;color:#C2185B;font-weight:600;margin:0 0 6px;letter-spacing:1.5px;text-transform:uppercase;">Exclusive Returning Client Offer</p>
          <p style="font-size:40px;font-weight:700;color:#C2185B;margin:0 0 4px;line-height:1;">10% OFF</p>
          <p style="font-size:13px;color:#888;margin:0 0 18px;">Simply mention this email when booking</p>
          <a href="${bookingLink}" style="display:inline-block;background:#C2185B;color:#fff;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Book My Appointment →</a>
        </div>
        <p style="font-size:12px;color:#bbb;text-align:center;margin:0;">Offer valid for a limited time. Cannot be combined with other promotions.</p>
      `,
    }),
  });
}

// ═══════════════════════════════════════════════
// 5. OFFER EMAIL — When Owner Adds an Offer
// ═══════════════════════════════════════════════
export async function sendOfferEmail({
  to, clientName, salonName, offerTitle, offerDescription,
  discountPercent, expiresAt, bookingLink,
}: {
  to: string; clientName: string; salonName: string;
  offerTitle: string; offerDescription?: string;
  discountPercent?: number; expiresAt?: string; bookingLink: string;
}) {
  const expiryFormatted = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  await resend.emails.send({
    from: FROM, to,
    subject: `Exclusive Offer for You — ${salonName}`,
    html: emailTemplate({
      title: "A Special Offer Just for You 🏷️", clientName,
      message: "As one of our valued clients, we wanted to share this exclusive offer with you before anyone else.",
      salonName, color: "#C2185B",
      extra: `
        <div style="background:linear-gradient(135deg,#FDE8F0,#F3E8FD);border:1.5px solid #C2185B;border-radius:12px;padding:24px;margin-bottom:20px;text-align:center;">
          ${discountPercent ? `<p style="font-size:48px;font-weight:700;color:#C2185B;margin:0 0 8px;line-height:1;">${discountPercent}% OFF</p>` : ""}
          <p style="font-size:18px;font-weight:600;color:#1a1a1a;margin:0 0 8px;">${offerTitle}</p>
          ${offerDescription ? `<p style="font-size:14px;color:#555;margin:0 0 12px;">${offerDescription}</p>` : ""}
          ${expiryFormatted ? `<p style="font-size:12px;color:#888;margin:0 0 18px;">⏳ Valid until <strong>${expiryFormatted}</strong></p>` : ""}
          <a href="${bookingLink}" style="display:inline-block;background:#C2185B;color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Book This Offer →</a>
        </div>
        <p style="font-size:12px;color:#bbb;text-align:center;margin:0;">This offer is exclusively available to our existing clients.</p>
      `,
    }),
  });
}