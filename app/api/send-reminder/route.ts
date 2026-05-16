import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  send24hReminder,
  send2hReminder,
  sendThankyouEmail,
  sendWinbackEmail,
} from "@/app/lib/email";
import {
  send24hSMS,
  send2hSMS,
  sendThankyouSMS,
  sendWinbackSMS,
  formatUKTime,
} from "@/app/lib/sms";
import {
  send24hWhatsApp,
  send2hWhatsApp,
  sendWinbackWhatsApp,
  sendThankyouWhatsApp,
  formatWATime,
} from "@/app/lib/whatsapp";

// ─────────────────────────────────────────────────────────
// MUST use service-role key — anon key is blocked by RLS
// ─────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // ← service role, not anon
);

// ─────────────────────────────────────────────────────────
// Helper: ±15-min window around a target UTC timestamp
// ─────────────────────────────────────────────────────────
function window15(targetMs: number) {
  return {
    start: new Date(targetMs - 15 * 60 * 1000).toISOString(),
    end:   new Date(targetMs + 15 * 60 * 1000).toISOString(),
  };
}

// ─────────────────────────────────────────────────────────
// Check Twilio opt-out table
// ─────────────────────────────────────────────────────────
async function isOptedOut(phone: string | null): Promise<boolean> {
  if (!phone) return false;
  const { data } = await supabase
    .from("sms_opt_outs")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  return !!data;
}

export async function GET(req: Request) {
  // ── Security ──────────────────────────────────────
  // Accept:
  //  1. Vercel cron (Authorization: Bearer <CRON_SECRET> header) — auto-added by Vercel
  //  2. Manual test via ?secret=YOUR_CRON_SECRET query param
  const { searchParams } = new URL(req.url);
  const querySecret = searchParams.get("secret");
  const authHeader  = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[Reminder] ❌ CRON_SECRET env var is not set!");
    return NextResponse.json({ error: "Server misconfiguration: CRON_SECRET missing" }, { status: 500 });
  }

  const isAuthorised = querySecret === cronSecret || bearerSecret === cronSecret;
  if (!isAuthorised) {
    console.warn(`[Reminder] ❌ Unauthorised. query=${querySecret?.slice(0,8)} bearer=${bearerSecret?.slice(0,8)}`);
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // ── Env check ─────────────────────────────────────
  const envCheck = {
    supabaseUrl:      !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey:   !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    resendKey:        !!process.env.RESEND_API_KEY,
    twilioSid:        !!process.env.TWILIO_ACCOUNT_SID,
    twilioToken:      !!process.env.TWILIO_AUTH_TOKEN,
    twilioPhone:      !!process.env.TWILIO_PHONE_NUMBER,
    twilioWhatsApp:   !!process.env.TWILIO_WHATSAPP_FROM,
    appUrl:           !!process.env.NEXT_PUBLIC_APP_URL,
  };
  console.log("[Reminder] Env check:", JSON.stringify(envCheck));

  const now = new Date();
  let sent = 0;
  const errors: string[] = [];

  // ── Time windows ──────────────────────────────────
  const w24h  = window15(now.getTime() + 24 * 60 * 60 * 1000);
  const w2h   = window15(now.getTime() +  2 * 60 * 60 * 1000);
  const w1hAgo = window15(now.getTime() -  1 * 60 * 60 * 1000);
  const w6wkAgo = window15(now.getTime() - 42 * 24 * 60 * 60 * 1000);

  console.log(`[Reminder] ⏰ Running at ${now.toISOString()}`);
  console.log(`[Reminder] 24h window: ${w24h.start} → ${w24h.end}`);

  // ════════════════════════════════════════════════════════
  // 1. 24h BEFORE — Appointment Reminder
  // ════════════════════════════════════════════════════════
  const { data: appts24, error: err24 } = await supabase
    .from("appointments")
    .select("*, services(name,price), staff(name), salons(name,slug,reminders_enabled,whatsapp_enabled,review_link)")
    .eq("status", "confirmed")
    .eq("reminder_24h_sent", false)
    .gte("date_time", w24h.start)
    .lte("date_time", w24h.end);

  if (err24) console.error("[Reminder] 24h query error:", err24);
  console.log(`[Reminder] 24h appointments found: ${appts24?.length ?? 0}`);

  for (const a of appts24 || []) {
    // reminders_enabled defaults TRUE — only skip if explicitly false
    if (a.salons?.reminders_enabled === false) {
      console.log(`[Reminder] Skipping ${a.id} — reminders disabled`);
      continue;
    }
    console.log(`[Reminder] Processing 24h for appointment ${a.id} (${a.client_name})`);

    const ukTime = formatUKTime(a.date_time);

    // Email
    if (a.client_email) {
      try {
        await send24hReminder({
          to: a.client_email,
          clientName: a.client_name,
          serviceName: a.services?.name || "Appointment",
          staffName: a.staff?.name,
          salonName: a.salons?.name || "Your Salon",
          dateTime: a.date_time,
          price: a.services?.price,
        });
      } catch (e) { errors.push(`24h email ${a.id}: ${e}`); }
    }

    // SMS
    if (a.client_phone && !(await isOptedOut(a.client_phone))) {
      try {
        await send24hSMS({
          to: a.client_phone,
          clientName: a.client_name,
          time: ukTime,
          salonName: a.salons?.name || "Your Salon",
        });
      } catch (e) { errors.push(`24h SMS ${a.id}: ${e}`); }
    }

    // WhatsApp
    if (a.client_phone && a.salons?.whatsapp_enabled && !(await isOptedOut(a.client_phone))) {
      try {
        await send24hWhatsApp({
          to:          a.client_phone,
          clientName:  a.client_name,
          time:        formatWATime(a.date_time),
          salonName:   a.salons?.name || "Your Salon",
          serviceName: a.services?.name,
        });
        await supabase
          .from("appointments")
          .update({ whatsapp_24h_sent: true })
          .eq("id", a.id);
      } catch (e) { errors.push(`24h WhatsApp ${a.id}: ${e}`); }
    }

    await supabase
      .from("appointments")
      .update({ reminder_24h_sent: true })
      .eq("id", a.id);
    sent++;
  }

  // ════════════════════════════════════════════════════════
  // 2. 2h BEFORE — Appointment Reminder
  // ════════════════════════════════════════════════════════
  const { data: appts2h, error: err2h } = await supabase
    .from("appointments")
    .select("*, services(name,price), staff(name), salons(name,slug,reminders_enabled,whatsapp_enabled)")
    .eq("status", "confirmed")
    .eq("reminder_2h_sent", false)
    .gte("date_time", w2h.start)
    .lte("date_time", w2h.end);

  if (err2h) console.error("[Reminder] 2h query error:", err2h);
  console.log(`[Reminder] 2h appointments found: ${appts2h?.length ?? 0}`);

  for (const a of appts2h || []) {
    if (a.salons?.reminders_enabled === false) continue;
    console.log(`[Reminder] Processing 2h for appointment ${a.id} (${a.client_name})`);

    const ukTime = formatUKTime(a.date_time);

    // Email
    if (a.client_email) {
      try {
        await send2hReminder({
          to: a.client_email,
          clientName: a.client_name,
          serviceName: a.services?.name || "Appointment",
          staffName: a.staff?.name,
          salonName: a.salons?.name || "Your Salon",
          dateTime: a.date_time,
          price: a.services?.price,
        });
      } catch (e) { errors.push(`2h email ${a.id}: ${e}`); }
    }

    // SMS
    if (a.client_phone && !(await isOptedOut(a.client_phone))) {
      try {
        await send2hSMS({
          to: a.client_phone,
          clientName: a.client_name,
          time: ukTime,
        });
      } catch (e) { errors.push(`2h SMS ${a.id}: ${e}`); }
    }

    // WhatsApp
    if (a.client_phone && a.salons?.whatsapp_enabled && !(await isOptedOut(a.client_phone))) {
      try {
        await send2hWhatsApp({
          to:         a.client_phone,
          clientName: a.client_name,
          time:       formatWATime(a.date_time),
          salonName:  a.salons?.name || "Your Salon",
        });
        await supabase
          .from("appointments")
          .update({ whatsapp_2h_sent: true })
          .eq("id", a.id);
      } catch (e) { errors.push(`2h WhatsApp ${a.id}: ${e}`); }
    }

    await supabase
      .from("appointments")
      .update({ reminder_2h_sent: true })
      .eq("id", a.id);
    sent++;
  }

  // ════════════════════════════════════════════════════════
  // 3. 1h AFTER — Thank You + Review Request
  // ════════════════════════════════════════════════════════
  const { data: appts1hAgo, error: err1h } = await supabase
    .from("appointments")
    .select("*, services(name), salons(name,slug,reminders_enabled,whatsapp_enabled,review_link)")
    .eq("status", "confirmed")
    .eq("thankyou_1h_sent", false)
    .gte("date_time", w1hAgo.start)
    .lte("date_time", w1hAgo.end);

  if (err1h) console.error("[Reminder] 1h-ago query error:", err1h);
  console.log(`[Reminder] 1h-ago appointments found: ${appts1hAgo?.length ?? 0}`);

  for (const a of appts1hAgo || []) {
    if (a.salons?.reminders_enabled === false) continue;
    console.log(`[Reminder] Processing thankyou for appointment ${a.id} (${a.client_name})`);

    const reviewLink = a.salons?.review_link || undefined;

    // Email
    if (a.client_email) {
      try {
        await sendThankyouEmail({
          to: a.client_email,
          clientName: a.client_name,
          salonName: a.salons?.name || "Your Salon",
          serviceName: a.services?.name,
          reviewLink,
        });
      } catch (e) { errors.push(`thankyou email ${a.id}: ${e}`); }
    }

    // SMS
    if (a.client_phone && !(await isOptedOut(a.client_phone))) {
      try {
        await sendThankyouSMS({
          to: a.client_phone,
          clientName: a.client_name,
          salonName: a.salons?.name || "Your Salon",
          reviewLink,
        });
      } catch (e) { errors.push(`thankyou SMS ${a.id}: ${e}`); }
    }

    // WhatsApp
    if (a.client_phone && a.salons?.whatsapp_enabled && !(await isOptedOut(a.client_phone))) {
      try {
        await sendThankyouWhatsApp({
          to:         a.client_phone,
          clientName: a.client_name,
          salonName:  a.salons?.name || "Your Salon",
          reviewLink,
        });
      } catch (e) { errors.push(`thankyou WhatsApp ${a.id}: ${e}`); }
    }

    await supabase
      .from("appointments")
      .update({ thankyou_1h_sent: true })
      .eq("id", a.id);
    sent++;
  }

  // ════════════════════════════════════════════════════════
  // 4. 6 WEEKS AFTER — Win-back
  // ════════════════════════════════════════════════════════
  const { data: appts6wk, error: err6wk } = await supabase
    .from("appointments")
    .select("*, services(name), salons(name,slug,reminders_enabled,whatsapp_enabled)")
    .eq("status", "confirmed")
    .eq("winback_sent", false)
    .gte("date_time", w6wkAgo.start)
    .lte("date_time", w6wkAgo.end);

  if (err6wk) console.error("[Reminder] winback query error:", err6wk);
  console.log(`[Reminder] Winback appointments found: ${appts6wk?.length ?? 0}`);

  for (const a of appts6wk || []) {
    if (a.salons?.reminders_enabled === false) continue;
    console.log(`[Reminder] Processing winback for appointment ${a.id} (${a.client_name})`);

    const bookingLink = `${process.env.NEXT_PUBLIC_APP_URL}/book/${a.salons?.slug}`;

    // Email
    if (a.client_email) {
      try {
        await sendWinbackEmail({
          to: a.client_email,
          clientName: a.client_name,
          salonName: a.salons?.name || "Your Salon",
          lastServiceName: a.services?.name,
          bookingLink,
        });
      } catch (e) { errors.push(`winback email ${a.id}: ${e}`); }
    }

    // SMS
    if (a.client_phone && !(await isOptedOut(a.client_phone))) {
      try {
        await sendWinbackSMS({
          to: a.client_phone,
          clientName: a.client_name,
          salonName: a.salons?.name || "Your Salon",
          bookingLink,
        });
      } catch (e) { errors.push(`winback SMS ${a.id}: ${e}`); }
    }

    // WhatsApp
    if (a.client_phone && a.salons?.whatsapp_enabled && !(await isOptedOut(a.client_phone))) {
      try {
        await sendWinbackWhatsApp({
          to:              a.client_phone,
          clientName:      a.client_name,
          salonName:       a.salons?.name || "Your Salon",
          bookingLink,
          lastServiceName: a.services?.name,
        });
        await supabase
          .from("appointments")
          .update({ whatsapp_winback_sent: true })
          .eq("id", a.id);
      } catch (e) { errors.push(`winback WhatsApp ${a.id}: ${e}`); }
    }

    await supabase
      .from("appointments")
      .update({ winback_sent: true })
      .eq("id", a.id);
    sent++;
  }

  console.log(`[Reminder] ✅ Done. sent=${sent} errors=${errors.length}`);
  return NextResponse.json({
    success: true,
    sent,
    errors: errors.length > 0 ? errors : undefined,
    checkedAt: now.toISOString(),
    timezone: "Europe/London",
  });
}