// Test booking confirmation emails (client + owner)
// Run: node test-booking-confirmation.mjs

import { Resend } from "resend";

const resend = new Resend("re_9PGmHTsQ_2RMdC2CcMGxecrFDsV14pNpw");
const FROM = "onboarding@resend.dev";
const TO   = "bookglam3@gmail.com";

// ── UK date/time (Europe/London) ──────────────────────
const apptTime = new Date();
apptTime.setDate(apptTime.getDate() + 1);
apptTime.setHours(14, 30, 0, 0);

const formattedDate = apptTime.toLocaleDateString("en-GB", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
  timeZone: "Europe/London",
});
const formattedTime = apptTime.toLocaleTimeString("en-GB", {
  hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/London",
});

// ── Shared config ──
const salonName     = "Glamour Salon";
const clientName    = "Sarah Mitchell";
const clientPhone   = "+44 7911 123456";
const clientEmail   = TO;
const serviceName   = "Balayage & Colour";
const staffName     = "Emma Johnson";
const price         = 85;
const depositOnly   = false;
const salonAddress  = "12 High Street, London, W1B 1AA";
const paymentStatus = "paid";
const cancelLink    = "https://feature-saas.vercel.app/book/glamour-salon";
const dashboardUrl  = "https://feature-saas.vercel.app/dashboard/bookings";

const amountPaid = depositOnly ? (price * 0.5).toFixed(2) : price.toFixed(2);
const amountDue  = depositOnly ? (price * 0.5).toFixed(2) : undefined;

// ════════════════════════════════════
// CLIENT EMAIL
// ════════════════════════════════════
const clientHtml = `
<!DOCTYPE html>
<html lang="en-GB">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F4F5;">
  <div style="max-width:540px;margin:32px auto;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#C2185B 0%,#7B2D52 100%);padding:36px 28px;text-align:center;">
      <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.2);display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:14px;">✅</div>
      <p style="color:rgba(255,255,255,0.75);margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;">${salonName}</p>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Booking Confirmed! ✂️</h1>
    </div>

    <!-- Greeting -->
    <div style="background:#fff;padding:28px 28px 0;">
      <p style="font-size:16px;margin:0 0 6px;color:#111;">Hi <strong>${clientName}</strong> 👋</p>
      <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">Your appointment at <strong>${salonName}</strong> is confirmed. We can't wait to see you!</p>

      <!-- Appointment Card -->
      <div style="background:#FDF5F8;border:1.5px solid #F0C4D4;border-radius:12px;padding:20px 22px;margin-bottom:22px;">
        <div style="font-size:11px;font-weight:700;color:#C2185B;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">Appointment Details</div>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="color:#999;padding:7px 0;width:130px;">✂️ Service</td><td style="font-weight:600;color:#0F172A;">${serviceName}</td></tr>
          <tr><td style="color:#999;padding:7px 0;">👩 Stylist</td><td style="font-weight:600;color:#0F172A;">${staffName}</td></tr>
          <tr><td style="color:#999;padding:7px 0;">📅 Date</td><td style="font-weight:600;color:#0F172A;">${formattedDate}</td></tr>
          <tr><td style="color:#999;padding:7px 0;">🕐 Time</td><td style="font-weight:700;color:#C2185B;font-size:16px;">${formattedTime}</td></tr>
          <tr><td style="color:#999;padding:7px 0;">💷 Price</td><td style="font-weight:700;color:#0F172A;">£${amountPaid}${depositOnly ? ` <span style='color:#D97706;font-size:12px;'>(deposit — £${amountDue} due at salon)</span>` : ""}</td></tr>
        </table>
      </div>

      <!-- Location -->
      <div style="background:#F8FAFF;border:1px solid #E0E7FF;border-radius:12px;padding:16px 20px;margin-bottom:22px;display:flex;align-items:flex-start;gap:12px;">
        <span style="font-size:20px;">📍</span>
        <div>
          <div style="font-size:12px;font-weight:700;color:#4F6EF7;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Location</div>
          <div style="font-size:14px;color:#334155;font-weight:500;line-height:1.5;">${salonAddress}</div>
          <a href="https://maps.google.com/?q=${encodeURIComponent(salonAddress)}" style="font-size:12px;color:#4F6EF7;font-weight:600;text-decoration:none;margin-top:6px;display:inline-block;">Open in Google Maps →</a>
        </div>
      </div>

      <!-- Cancel / Reschedule -->
      <div style="background:#FFFBF0;border:1px solid #FDE68A;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <div style="font-size:13px;color:#78350F;line-height:1.6;">
          <strong>Need to reschedule or cancel?</strong><br/>
          Please give us at least 24 hours notice. Contact us directly or
          <a href="${cancelLink}" style="color:#C2185B;font-weight:600;"> click here to manage your booking</a>.
        </div>
      </div>

      <p style="font-size:13px;color:#94A3B8;margin:0 0 4px;line-height:1.6;">We look forward to welcoming you.</p>
      <p style="font-size:13px;color:#94A3B8;margin:0;line-height:1.6;">— The ${salonName} Team</p>
    </div>

    <!-- Footer -->
    <div style="background:#F9F9F9;border-top:1px solid #EFEFEF;padding:18px 28px;text-align:center;margin-top:28px;">
      <p style="font-size:12px;color:#bbb;margin:0;line-height:1.8;">
        ${salonName} &bull; United Kingdom<br/>
        This is an automated confirmation — please do not reply to this email.<br/>
        <a href="https://feature-saas.vercel.app/unsubscribe" style="color:#bbb;text-decoration:underline;font-size:11px;">Unsubscribe from reminders</a>
      </p>
    </div>
  </div>
</body>
</html>`;

// ════════════════════════════════════
// OWNER EMAIL
// ════════════════════════════════════
const paymentBadge = paymentStatus === "paid"
  ? { label: "Paid in Full",      color: "#059669", bg: "#D1FAE5" }
  : paymentStatus === "deposit_paid"
  ? { label: "Deposit Paid (50%)", color: "#D97706", bg: "#FEF3C7" }
  : { label: "Unpaid",             color: "#DC2626", bg: "#FEE2E2" };

const ownerHtml = `
<!DOCTYPE html>
<html lang="en-GB">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F4F5;">
  <div style="max-width:540px;margin:32px auto;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1E3A8A 0%,#3730A3 100%);padding:36px 28px;text-align:center;">
      <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.2);display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:14px;">🎉</div>
      <p style="color:rgba(255,255,255,0.75);margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;">${salonName}</p>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">New Booking!</h1>
    </div>

    <div style="background:#fff;padding:28px;">

      <!-- Payment badge -->
      <div style="text-align:center;margin-bottom:22px;">
        <span style="display:inline-block;background:${paymentBadge.bg};color:${paymentBadge.color};font-size:13px;font-weight:700;padding:6px 18px;border-radius:999px;border:1.5px solid ${paymentBadge.color};">
          💳 ${paymentBadge.label}
        </span>
      </div>

      <!-- Client Details -->
      <div style="background:#F8FAFF;border:1.5px solid #E0E7FF;border-radius:12px;padding:20px 22px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:700;color:#3730A3;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">Client Details</div>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="color:#999;padding:7px 0;width:110px;">👤 Name</td><td style="font-weight:700;color:#0F172A;font-size:16px;">${clientName}</td></tr>
          <tr><td style="color:#999;padding:7px 0;">📱 Phone</td><td style="font-weight:600;"><a href="tel:${clientPhone}" style="color:#3730A3;text-decoration:none;">${clientPhone}</a></td></tr>
          <tr><td style="color:#999;padding:7px 0;">📧 Email</td><td style="font-weight:600;"><a href="mailto:${clientEmail}" style="color:#3730A3;text-decoration:none;">${clientEmail}</a></td></tr>
        </table>
      </div>

      <!-- Appointment Details -->
      <div style="background:#FDF5F8;border:1.5px solid #F0C4D4;border-radius:12px;padding:20px 22px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:700;color:#C2185B;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">Appointment</div>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="color:#999;padding:7px 0;width:110px;">✂️ Service</td><td style="font-weight:600;color:#0F172A;">${serviceName}</td></tr>
          <tr><td style="color:#999;padding:7px 0;">👩 Stylist</td><td style="font-weight:600;color:#0F172A;">${staffName}</td></tr>
          <tr><td style="color:#999;padding:7px 0;">📅 Date</td><td style="font-weight:600;color:#0F172A;">${formattedDate}</td></tr>
          <tr><td style="color:#999;padding:7px 0;">🕐 Time</td><td style="font-weight:700;color:#C2185B;font-size:16px;">${formattedTime}</td></tr>
          <tr><td style="color:#999;padding:7px 0;">💷 Amount</td><td style="font-weight:700;color:#059669;">£${amountPaid} received</td></tr>
        </table>
      </div>

      <!-- Dashboard CTA -->
      <div style="text-align:center;margin-bottom:8px;">
        <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#1E3A8A 0%,#3730A3 100%);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(55,48,163,0.3);">View in Dashboard →</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#F9F9F9;border-top:1px solid #EFEFEF;padding:16px 28px;text-align:center;">
      <p style="font-size:12px;color:#bbb;margin:0;line-height:1.8;">
        ${salonName} &bull; Powered by feature &bull; United Kingdom<br/>
        This is an automated notification from your booking system.
      </p>
    </div>
  </div>
</body>
</html>`;

// ════════════════════════════════════
// SEND BOTH
// ════════════════════════════════════
console.log(`\n📧 Sending booking confirmation emails to ${TO}...\n`);

// Client email
const { data: c, error: ce } = await resend.emails.send({
  from: FROM, to: TO,
  subject: `[TEST] Booking Confirmed! ✂️ ${salonName}`,
  html: clientHtml,
});
ce ? console.error("❌ Client email failed:", ce)
   : console.log(`✅ CLIENT email sent — ID: ${c?.id}`);

// Short delay
await new Promise(r => setTimeout(r, 500));

// Owner email
const { data: o, error: oe } = await resend.emails.send({
  from: FROM, to: TO,
  subject: `[TEST] New Booking! ${clientName} — ${formattedDate} at ${formattedTime}`,
  html: ownerHtml,
});
oe ? console.error("❌ Owner email failed:", oe)
   : console.log(`✅ OWNER email sent  — ID: ${o?.id}`);

console.log(`\n✅ Done! Check ${TO} inbox.\n`);
