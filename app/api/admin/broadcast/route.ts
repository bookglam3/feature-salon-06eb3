import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { sendSMS } from "@/app/lib/sms";
import { sendWhatsApp } from "@/app/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Large recipient lists may take a while — allow up to 5 minutes
export const maxDuration = 300;

const ADMIN_EMAIL = "adilgill2008@gmail.com";

// ── Same DB connection / env keys as the rest of the project ────
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Resend (existing email service)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@featuresalon.co.uk";

// ── Channel availability — derived purely from existing env keys ─
const HAS_EMAIL    = !!process.env.RESEND_API_KEY;
const HAS_SMS      = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
const HAS_WHATSAPP = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);

type Channel = "email" | "whatsapp" | "sms";
type RecipientType = "registered" | "all";
type CountryCode = "GB" | "PK" | "AE" | "SA";

interface Recipient {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  country?: string | null;
}

// ── Admin auth (same pattern as /api/partners) ──────────────────
async function verifyAdmin(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
  if (!token) return null;
  const { data: { user }, error } = await adminSupabase.auth.getUser(token);
  if (error || !user) return null;
  if (user.email !== ADMIN_EMAIL) return null;
  return user;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, m => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]!
  ));
}

// Detect Arabic/Urdu so we can render RTL in the email template
function isRTL(text: string): boolean {
  return /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(text);
}

function buildEmailHtml(subject: string, message: string): string {
  const rtl = isRTL(message) || isRTL(subject);
  const body = escapeHtml(message).replace(/\n/g, "<br/>");
  return `
  <!DOCTYPE html>
  <html lang="en-GB" dir="${rtl ? "rtl" : "ltr"}">
  <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
  <body style="margin:0;padding:0;background:#F4F4F5;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E5E7EB;">
      <div style="background:linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%);padding:32px 28px;text-align:center;">
        <p style="color:rgba(255,255,255,0.7);margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Feature Salon</p>
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;" dir="${rtl ? "rtl" : "ltr"}">${escapeHtml(subject)}</h1>
      </div>
      <div style="padding:28px;font-size:14px;color:#374151;line-height:1.7;" dir="${rtl ? "rtl" : "ltr"}">
        ${body}
      </div>
      <div style="padding:14px 28px;background:#F9FAFB;text-align:center;border-top:1px solid #E5E7EB;font-size:11px;color:#9CA3AF;">
        Sent by Feature Salon
      </div>
    </div>
  </body>
  </html>`;
}

// ── Country code → dial-code phone normaliser ─────────────────────
const COUNTRY_DIAL: Record<CountryCode, { code: string; expectLen: number }> = {
  GB: { code: "44",  expectLen: 10 }, // after country code → 10 digits
  PK: { code: "92",  expectLen: 10 },
  AE: { code: "971", expectLen: 9  },
  SA: { code: "966", expectLen: 9  },
};

function normaliseForCountry(raw: string, country: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // Already includes any country code
  if (raw.trim().startsWith("+") || digits.length >= 11) {
    // Trust as E.164 if length looks plausible
    if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  }

  const c = (country || "GB").toUpperCase() as CountryCode;
  const cfg = COUNTRY_DIAL[c] || COUNTRY_DIAL.GB;

  // strip leading zero
  if (digits.startsWith("0")) digits = digits.slice(1);

  // If digits already start with this dial code, accept
  if (digits.startsWith(cfg.code)) return `+${digits}`;

  return `+${cfg.code}${digits}`;
}

// ── GET — capabilities + recent logs + per-country counts ────────
export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Per-country counts of consented registered users
  const { data: countRows, error: countErr } = await adminSupabase
    .from("salons")
    .select("country, marketing_consent");

  if (countErr) {
    console.error("[/api/admin/broadcast] count load failed:", countErr.message);
  }

  const countsByCountry: Record<string, number> = { GB: 0, PK: 0, AE: 0, SA: 0, OTHER: 0 };
  let consentedTotal = 0;
  let totalUsers = 0;
  for (const row of (countRows || []) as { country: string | null; marketing_consent: boolean | null }[]) {
    totalUsers++;
    if (row.marketing_consent === false) continue;
    consentedTotal++;
    const c = (row.country || "GB").toUpperCase();
    if (c in countsByCountry) countsByCountry[c]++;
    else countsByCountry.OTHER++;
  }

  const { data: logs, error: logErr } = await adminSupabase
    .from("broadcast_logs")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(200);

  if (logErr) {
    console.error("[/api/admin/broadcast] logs load failed:", logErr.message);
  }

  return NextResponse.json({
    capabilities: { email: HAS_EMAIL, sms: HAS_SMS, whatsapp: HAS_WHATSAPP },
    countsByCountry,
    consentedTotal,
    totalUsers,
    logs: logs || [],
  });
}

// ── POST — dispatch a broadcast ──────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const subject: string              = (body.subject || "").trim();
  const message: string              = (body.message || "").trim();
  const requestedChannels: Channel[] = Array.isArray(body.channels) ? body.channels : [];
  const recipientType: RecipientType = body.recipientType;
  const countriesRaw: string[]       = Array.isArray(body.countries) ? body.countries : ["ALL"];

  if (!subject) return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  if (!message) return NextResponse.json({ error: "Message body is required" }, { status: 400 });
  if (requestedChannels.length === 0) return NextResponse.json({ error: "Select at least one channel" }, { status: 400 });
  if (!["registered", "all"].includes(recipientType)) {
    return NextResponse.json({ error: "Invalid recipient type" }, { status: 400 });
  }

  // Strip any channel whose env keys aren't configured
  const channels: Channel[] = requestedChannels.filter(c => {
    if (c === "email")    return HAS_EMAIL;
    if (c === "sms")      return HAS_SMS;
    if (c === "whatsapp") return HAS_WHATSAPP;
    return false;
  });
  if (channels.length === 0) {
    return NextResponse.json({ error: "None of the selected channels are configured" }, { status: 400 });
  }

  // ── Build recipient list ─────────────────────────────────────
  let query = adminSupabase.from("salons").select("owner_email, phone, name, country, marketing_consent");
  if (recipientType === "registered") {
    // Honour marketing consent
    query = query.eq("marketing_consent", true);
  }

  const wantsAll = countriesRaw.includes("ALL") || countriesRaw.length === 0;
  if (!wantsAll) {
    query = query.in("country", countriesRaw);
  }

  const { data: rows, error: rowsErr } = await query;
  if (rowsErr) {
    console.error("[/api/admin/broadcast] recipient load failed:", rowsErr.message);
    return NextResponse.json({ error: rowsErr.message }, { status: 500 });
  }

  const seen = new Set<string>();
  const recipients: Recipient[] = [];
  for (const r of (rows || []) as { owner_email: string | null; phone: string | null; name: string | null; country: string | null; marketing_consent: boolean | null }[]) {
    const key = (r.owner_email || r.phone || "").toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    recipients.push({
      email:   r.owner_email,
      phone:   r.phone,
      name:    r.name,
      country: r.country,
    });
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: "No recipients matched the filters" }, { status: 400 });
  }

  // ── Dispatch ────────────────────────────────────────────────
  let totalSent = 0;
  let totalFailed = 0;
  const perChannel: { channel: Channel; sent: number; failed: number }[] = [];

  for (const channel of channels) {
    let sent = 0, failed = 0;

    for (const r of recipients) {
      try {
        if (channel === "email") {
          if (!r.email || !resend) { continue; }
          const { error: mailErr } = await resend.emails.send({
            from: FROM_EMAIL,
            to: r.email,
            subject,
            html: buildEmailHtml(subject, message),
          });
          if (mailErr) { failed++; console.error("[broadcast email]", r.email, mailErr); }
          else sent++;
        } else if (channel === "sms") {
          if (!r.phone) continue;
          const num = normaliseForCountry(r.phone, r.country) || r.phone;
          await sendSMS(num, `${subject}\n\n${message}`);
          sent++;
        } else if (channel === "whatsapp") {
          if (!r.phone) continue;
          const num = normaliseForCountry(r.phone, r.country) || r.phone;
          await sendWhatsApp(num, `*${subject}*\n\n${message}`);
          sent++;
        }
      } catch (e) {
        failed++;
        console.error(`[broadcast ${channel}] failed for`, r.email || r.phone, e);
      }
    }

    perChannel.push({ channel, sent, failed });
    totalSent   += sent;
    totalFailed += failed;
  }

  const status = totalFailed === 0 && totalSent > 0
    ? "success"
    : totalSent === 0
    ? "failed"
    : "partial";

  const { data: log, error: logErr } = await adminSupabase
    .from("broadcast_logs")
    .insert({
      subject,
      message,
      channels:         channels,
      countries:        wantsAll ? ["ALL"] : countriesRaw,
      recipient_type:   recipientType,
      total_sent:       totalSent,
      total_failed:     totalFailed,
      sent_by_admin_id: user.id,
      status,
    })
    .select()
    .single();

  if (logErr) console.error("[/api/admin/broadcast] log insert failed:", logErr.message);

  return NextResponse.json({
    success: true,
    log,
    perChannel,
    totalSent,
    totalFailed,
    totalRecipients: recipients.length,
  });
}
