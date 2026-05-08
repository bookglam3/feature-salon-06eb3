// Direct test: sends booking confirmation to both client and owner
// node test-confirmation-direct.mjs

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  "https://uasmpuyyzkgpkauxuuvr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhc21wdXl5emtncGthdXh1dXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDMwNjEsImV4cCI6MjA5Mjk3OTA2MX0.khVeWKTk-LsD-wMIWO_lRwzM99HlLSQQpuN-N0onO7o"
);
const resend = new Resend("re_9PGmHTsQ_2RMdC2CcMGxecrFDsV14pNpw");
const FROM = "onboarding@resend.dev";

// Test targets
const CLIENT_EMAIL = "adilgill2k25@gmail.com";
const OWNER_EMAIL  = "bookglam3@gmail.com";

// --- UK date/time formatter ---
function formatDate(dateTime) {
  const date = new Date(dateTime);
  return {
    formattedDate: date.toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      timeZone: "Europe/London",
    }),
    formattedTime: date.toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit", hour12: false,
      timeZone: "Europe/London",
    }),
  };
}

// --- Find most recent real appointment at my-salon-adil ---
console.log("Fetching most recent appointment from my-salon-adil...");

const { data: appt, error } = await supabase
  .from("appointments")
  .select(`*, services(name,price), staff(name), salons(name,slug,address)`)
  .neq("client_name", "DIAGNOSTIC_TEST")
  .neq("client_name", "DIAGNOSTIC_TEST_PM")
  .order("created_at", { ascending: false })
  .limit(1)
  .single();

if (error || !appt) {
  console.error("No appointments found:", error);
  // Use mock data instead
  console.log("Using mock appointment data for test...");
}

const apptData = appt || {
  client_name: "Adil Test",
  client_phone: "+44 7911 000000",
  services: { name: "Haircut & Style", price: 45 },
  staff: { name: "Emma" },
  date_time: new Date(Date.now() + 86400000).toISOString(),
  payment_status: "paid",
  salons: { name: "Anita Love Hair", address: "123 High Street, London" },
};

const { formattedDate, formattedTime } = formatDate(apptData.date_time);
const salonName    = apptData.salons?.name     || "The Salon";
const serviceName  = apptData.services?.name   || "Appointment";
const staffName    = apptData.staff?.name      || "";
const price        = apptData.services?.price  || 0;
const salonAddress = apptData.salons?.address  || "";
const clientName   = apptData.client_name;
const clientPhone  = apptData.client_phone     || "";
const paymentStatus = apptData.payment_status  || "paid";

const paymentBadge = paymentStatus === "paid"
  ? { label: "Paid in Full",      color: "#059669", bg: "#D1FAE5" }
  : paymentStatus === "deposit_paid"
  ? { label: "Deposit Paid (50%)", color: "#D97706", bg: "#FEF3C7" }
  : { label: "Unpaid / Pay at Salon", color: "#DC2626", bg: "#FEE2E2" };

// ══════════════════════════════════════════
// CLIENT EMAIL
// ══════════════════════════════════════════
const clientHtml = `<!DOCTYPE html>
<html lang="en-GB">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F4F5;">
  <div style="max-width:540px;margin:32px auto;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#C2185B 0%,#7B2D52 100%);padding:36px 28px;text-align:center;">
      <p style="color:rgba(255,255,255,0.75);margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;">${salonName}</p>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Booking Confirmed! ✂️</h1>
    </div>
    <div style="background:#fff;padding:28px 28px 0;">
      <p style="font-size:16px;margin:0 0 6px;color:#111;">Hi <strong>${clientName}</strong> 👋</p>
      <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">Your appointment at <strong>${salonName}</strong> is confirmed. We can't wait to see you!</p>
      <div style="background:#FDF5F8;border:1.5px solid #F0C4D4;border-radius:12px;padding:20px 22px;margin-bottom:22px;">
        <div style="font-size:11px;font-weight:700;color:#C2185B;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">Appointment Details</div>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="color:#999;padding:7px 0;width:130px;">✂️ Service</td><td style="font-weight:600;color:#0F172A;">${serviceName}</td></tr>
          ${staffName ? `<tr><td style="color:#999;padding:7px 0;">👩 Stylist</td><td style="font-weight:600;color:#0F172A;">${staffName}</td></tr>` : ""}
          <tr><td style="color:#999;padding:7px 0;">📅 Date</td><td style="font-weight:600;color:#0F172A;">${formattedDate}</td></tr>
          <tr><td style="color:#999;padding:7px 0;">🕐 Time</td><td style="font-weight:700;color:#C2185B;font-size:16px;">${formattedTime}</td></tr>
          <tr><td style="color:#999;padding:7px 0;">💷 Price</td><td style="font-weight:700;color:#0F172A;">£${price.toFixed(2)}</td></tr>
        </table>
      </div>
      ${salonAddress ? `<div style="background:#F8FAFF;border:1px solid #E0E7FF;border-radius:12px;padding:16px 20px;margin-bottom:22px;">
        <div style="font-size:12px;font-weight:700;color:#4F6EF7;text-transform:uppercase;margin-bottom:4px;">📍 Location</div>
        <div style="font-size:14px;color:#334155;">${salonAddress}</div>
        <a href="https://maps.google.com/?q=${encodeURIComponent(salonAddress)}" style="font-size:12px;color:#4F6EF7;font-weight:600;text-decoration:none;margin-top:6px;display:inline-block;">Open in Google Maps →</a>
      </div>` : ""}
      <div style="background:#FFFBF0;border:1px solid #FDE68A;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <div style="font-size:13px;color:#78350F;line-height:1.6;">
          <strong>Need to reschedule or cancel?</strong><br/>
          Please give us at least 24 hours notice. Visit <a href="https://featuresalon.co.uk/book/my-salon-adil" style="color:#C2185B;font-weight:600;">our booking page</a> or contact us directly.
        </div>
      </div>
      <p style="font-size:13px;color:#94A3B8;margin:0 0 4px;">We look forward to welcoming you.</p>
      <p style="font-size:13px;color:#94A3B8;margin:0 0 28px;">— The ${salonName} Team</p>
    </div>
    <div style="background:#F9F9F9;border-top:1px solid #EFEFEF;padding:18px 28px;text-align:center;">
      <p style="font-size:12px;color:#bbb;margin:0;line-height:1.8;">
        ${salonName} · United Kingdom<br/>
        <a href="https://featuresalon.co.uk/unsubscribe" style="color:#bbb;font-size:11px;">Unsubscribe from reminders</a>
      </p>
    </div>
  </div>
</body></html>`;

// ══════════════════════════════════════════
// OWNER EMAIL
// ══════════════════════════════════════════
const ownerHtml = `<!DOCTYPE html>
<html lang="en-GB">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F4F5;">
  <div style="max-width:540px;margin:32px auto;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#1E3A8A 0%,#3730A3 100%);padding:36px 28px;text-align:center;">
      <p style="color:rgba(255,255,255,0.75);margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;">${salonName}</p>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">🎉 New Booking!</h1>
    </div>
    <div style="background:#fff;padding:28px;">
      <div style="text-align:center;margin-bottom:22px;">
        <span style="display:inline-block;background:${paymentBadge.bg};color:${paymentBadge.color};font-size:13px;font-weight:700;padding:6px 18px;border-radius:999px;border:1.5px solid ${paymentBadge.color};">
          💳 ${paymentBadge.label}
        </span>
      </div>
      <div style="background:#F8FAFF;border:1.5px solid #E0E7FF;border-radius:12px;padding:20px 22px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:700;color:#3730A3;text-transform:uppercase;margin-bottom:14px;">Client Details</div>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="color:#999;padding:7px 0;width:110px;">👤 Name</td><td style="font-weight:700;color:#0F172A;font-size:16px;">${clientName}</td></tr>
          <tr><td style="color:#999;padding:7px 0;">📱 Phone</td><td style="font-weight:600;"><a href="tel:${clientPhone}" style="color:#3730A3;text-decoration:none;">${clientPhone}</a></td></tr>
          <tr><td style="color:#999;padding:7px 0;">📧 Email</td><td style="font-weight:600;"><a href="mailto:${CLIENT_EMAIL}" style="color:#3730A3;text-decoration:none;">${CLIENT_EMAIL}</a></td></tr>
        </table>
      </div>
      <div style="background:#FDF5F8;border:1.5px solid #F0C4D4;border-radius:12px;padding:20px 22px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:700;color:#C2185B;text-transform:uppercase;margin-bottom:14px;">Appointment</div>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="color:#999;padding:7px 0;width:110px;">✂️ Service</td><td style="font-weight:600;color:#0F172A;">${serviceName}</td></tr>
          ${staffName ? `<tr><td style="color:#999;padding:7px 0;">👩 Stylist</td><td style="font-weight:600;color:#0F172A;">${staffName}</td></tr>` : ""}
          <tr><td style="color:#999;padding:7px 0;">📅 Date</td><td style="font-weight:600;color:#0F172A;">${formattedDate}</td></tr>
          <tr><td style="color:#999;padding:7px 0;">🕐 Time</td><td style="font-weight:700;color:#C2185B;font-size:16px;">${formattedTime}</td></tr>
          <tr><td style="color:#999;padding:7px 0;">💷 Amount</td><td style="font-weight:700;color:#059669;">£${price.toFixed(2)}</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin-bottom:8px;">
        <a href="https://featuresalon.co.uk/dashboard/bookings" style="display:inline-block;background:linear-gradient(135deg,#1E3A8A 0%,#3730A3 100%);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">View in Dashboard →</a>
      </div>
    </div>
    <div style="background:#F9F9F9;border-top:1px solid #EFEFEF;padding:16px 28px;text-align:center;">
      <p style="font-size:12px;color:#bbb;margin:0;line-height:1.8;">${salonName} · Powered by feature · United Kingdom</p>
    </div>
  </div>
</body></html>`;

// ══════════════════════════════════════════
// SEND
// ══════════════════════════════════════════
console.log(`\nSending booking confirmation emails...`);
console.log(`Client: ${CLIENT_EMAIL}`);
console.log(`Owner:  ${OWNER_EMAIL}\n`);

const { data: c, error: ce } = await resend.emails.send({
  from: FROM, to: CLIENT_EMAIL,
  subject: `Booking Confirmed! ✂️ ${salonName}`,
  html: clientHtml,
});
ce ? console.error("❌ Client email FAILED:", ce) : console.log(`✅ CLIENT email → ${CLIENT_EMAIL} | ID: ${c?.id}`);

await new Promise(r => setTimeout(r, 500));

const { data: o, error: oe } = await resend.emails.send({
  from: FROM, to: OWNER_EMAIL,
  subject: `New Booking! ${clientName} — ${formattedDate} at ${formattedTime}`,
  html: ownerHtml,
});
oe ? console.error("❌ Owner email FAILED:", oe) : console.log(`✅ OWNER email  → ${OWNER_EMAIL}  | ID: ${o?.id}`);

console.log("\n✅ Done!\n");
