import twilio from "twilio";

// ─────────────────────────────────────────────────────────
// Twilio client — UK +44 sender
// ─────────────────────────────────────────────────────────
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER!; // e.g. +447700900000

// GDPR opt-out footer appended to every SMS (required for UK ICO compliance)
const GDPR_FOOTER = "\n\nReply STOP to opt out of reminders.";

// ─────────────────────────────────────────────────────────
// Normalise UK phone → E.164 (+44...)
// Accepts: 07911 123456 / 447911123456 / +447911123456
// ─────────────────────────────────────────────────────────
export function normaliseUKPhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");

  if (digits.startsWith("44") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11)   return `+44${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 10)   return `+44${digits}`;

  // Already has +44
  if (raw.startsWith("+44") && digits.length === 12) return `+${digits}`;

  return null; // unrecognised format — skip SMS
}

// ─────────────────────────────────────────────────────────
// UK time formatter (Europe/London — handles GMT/BST auto)
// ─────────────────────────────────────────────────────────
export function formatUKTime(dateTime: string): string {
  return new Date(dateTime).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  });
}

export function formatUKDate(dateTime: string): string {
  return new Date(dateTime).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/London",
  });
}

// ─────────────────────────────────────────────────────────
// Core SMS sender
// ─────────────────────────────────────────────────────────
async function sendSMS(to: string, body: string): Promise<void> {
  const normalisedTo = normaliseUKPhone(to);
  if (!normalisedTo) {
    console.warn(`[SMS] Skipping — could not normalise phone: ${to}`);
    return;
  }

  try {
    await client.messages.create({
      from: FROM_NUMBER,
      to: normalisedTo,
      body: body + GDPR_FOOTER,
    });
    console.log(`[SMS] Sent to ${normalisedTo}`);
  } catch (err) {
    console.error(`[SMS] Failed to send to ${normalisedTo}:`, err);
  }
}

// ═══════════════════════════════════════════════════════════
// 1. 24h Before — Appointment Reminder
// ═══════════════════════════════════════════════════════════
export async function send24hSMS({
  to,
  clientName,
  time,
  salonName,
}: {
  to: string;
  clientName: string;
  time: string; // pre-formatted UK time string
  salonName: string;
}) {
  const body =
    `Hi ${clientName}, reminder: your appointment is tomorrow at ${time} at ${salonName}. See you then!`;
  await sendSMS(to, body);
}

// ═══════════════════════════════════════════════════════════
// 2. 2h Before — Appointment Reminder
// ═══════════════════════════════════════════════════════════
export async function send2hSMS({
  to,
  clientName,
  time,
}: {
  to: string;
  clientName: string;
  time: string;
}) {
  const body =
    `Hi ${clientName}, just a reminder: your appointment is in 2 hours at ${time}. We look forward to seeing you!`;
  await sendSMS(to, body);
}

// ═══════════════════════════════════════════════════════════
// 3. 1h After — Thank You + Review Request
// ═══════════════════════════════════════════════════════════
export async function sendThankyouSMS({
  to,
  clientName,
  salonName,
  reviewLink,
}: {
  to: string;
  clientName: string;
  salonName: string;
  reviewLink?: string;
}) {
  const reviewPart = reviewLink
    ? ` We'd love to hear your feedback: ${reviewLink}`
    : "";
  const body =
    `Hi ${clientName}, thank you for visiting ${salonName} today!${reviewPart}`;
  await sendSMS(to, body);
}

// ═══════════════════════════════════════════════════════════
// 4. 6 Weeks After — Win-back
// ═══════════════════════════════════════════════════════════
export async function sendWinbackSMS({
  to,
  clientName,
  salonName,
  bookingLink,
}: {
  to: string;
  clientName: string;
  salonName: string;
  bookingLink: string;
}) {
  const body =
    `Hi ${clientName}, it's been 6 weeks since your last visit to ${salonName}! Ready for your next appointment? Book now: ${bookingLink}`;
  await sendSMS(to, body);
}
