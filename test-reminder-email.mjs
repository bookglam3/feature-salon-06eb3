// Quick test: sends a 24h reminder email via Resend to bookglam3@gmail.com
// Run: node test-reminder-email.mjs

import { Resend } from "resend";

const resend = new Resend("re_9PGmHTsQ_2RMdC2CcMGxecrFDsV14pNpw");
const FROM   = "onboarding@resend.dev";
const TO     = "bookglam3@gmail.com";

// ── Shared template (mirrors app/lib/email.ts) ──
function emailTemplate({ title, clientName, message, serviceName, formattedDate, formattedTime, staffName, salonName, color, price, extra }) {
  return `<!DOCTYPE html>
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
        Glamour Salon &bull; United Kingdom<br/>
        This is a <strong>TEST</strong> automated message.<br/>
        <a href="https://feature-saas.vercel.app/unsubscribe" style="color:#bbb;text-decoration:underline;font-size:11px;">Unsubscribe from reminders</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ── Prepare test data ──
const now = new Date();
// Fake appointment: tomorrow at 14:30 London time
const apptTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
apptTime.setHours(14, 30, 0, 0);

const formattedDate = apptTime.toLocaleDateString("en-GB", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
  timeZone: "Europe/London",
});
const formattedTime = apptTime.toLocaleTimeString("en-GB", {
  hour: "2-digit", minute: "2-digit", hour12: false,
  timeZone: "Europe/London",
});

// ── Send all 4 reminder types ──
const tests = [
  {
    subject: `[TEST] Reminder: Your appointment tomorrow at ${formattedTime} — Glamour Salon`,
    title: "Appointment Reminder — Tomorrow ⏰",
    message: "This is a friendly reminder that you have an appointment with us <strong>tomorrow</strong>. We look forward to welcoming you.",
    extra: undefined,
  },
  {
    subject: `[TEST] See you in 2 hours — Glamour Salon`,
    title: "See You Soon — 2 Hours to Go! 💅",
    message: "Just a quick reminder that your appointment is in <strong>2 hours</strong>. We are looking forward to seeing you shortly!",
    extra: undefined,
  },
  {
    subject: `[TEST] Thank you for visiting Glamour Salon today! 💕`,
    title: "Thank You for Your Visit! 🌟",
    message: "It was wonderful to have you with us today for your <strong>Balayage &amp; Colour</strong>. We hope you love the results!",
    extra: `
      <div style="background:linear-gradient(135deg,#FDE8F0,#F3E8FD);border:1.5px solid #C2185B;border-radius:12px;padding:22px;margin-bottom:20px;text-align:center;">
        <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 8px;">Share Your Experience</p>
        <p style="font-size:13px;color:#555;margin:0 0 18px;">Your feedback means the world to us and helps other clients find us.</p>
        <a href="https://g.page/r/example/review" style="display:inline-block;background:#C2185B;color:#fff;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Leave a Review ⭐</a>
      </div>
      <p style="font-size:12px;color:#bbb;text-align:center;margin:0;">Takes less than 60 seconds — and it makes a huge difference. Thank you! 🙏</p>
    `,
  },
  {
    subject: `[TEST] We'd love to see you again — Glamour Salon`,
    title: "We Miss You! 💕",
    message: "It has been a little while since your last visit for your <strong>Balayage &amp; Colour</strong>, and we would love to welcome you back. As a valued client, we are offering you an exclusive discount on your next appointment.",
    extra: `
      <div style="background:linear-gradient(135deg,#FDE8F0,#F3E8FD);border:1.5px solid #C2185B;border-radius:12px;padding:22px;margin-bottom:20px;text-align:center;">
        <p style="font-size:11px;color:#C2185B;font-weight:600;margin:0 0 6px;letter-spacing:1.5px;text-transform:uppercase;">Exclusive Returning Client Offer</p>
        <p style="font-size:40px;font-weight:700;color:#C2185B;margin:0 0 4px;line-height:1;">10% OFF</p>
        <p style="font-size:13px;color:#888;margin:0 0 18px;">Simply mention this email when booking</p>
        <a href="https://feature-saas.vercel.app/book/glamour-salon" style="display:inline-block;background:#C2185B;color:#fff;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Book My Appointment →</a>
      </div>
      <p style="font-size:12px;color:#bbb;text-align:center;margin:0;">Offer valid for a limited time. Cannot be combined with other promotions.</p>
    `,
  },
];

console.log(`\n📧 Sending ${tests.length} test reminder emails to ${TO}...\n`);

for (let i = 0; i < tests.length; i++) {
  const t = tests[i];
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: TO,
    subject: t.subject,
    html: emailTemplate({
      title: t.title,
      clientName: "Sarah",
      message: t.message,
      serviceName: "Balayage & Colour",
      formattedDate,
      formattedTime,
      staffName: "Emma",
      salonName: "Glamour Salon",
      color: "#C2185B",
      price: 85,
      extra: t.extra,
    }),
  });

  if (error) {
    console.error(`❌ Email ${i + 1} failed:`, error);
  } else {
    console.log(`✅ Email ${i + 1} sent — ID: ${data?.id}`);
    console.log(`   Subject: ${t.subject}`);
  }

  // Small delay between sends
  if (i < tests.length - 1) await new Promise(r => setTimeout(r, 500));
}

console.log("\n✅ Done! Check bookglam3@gmail.com inbox.\n");
