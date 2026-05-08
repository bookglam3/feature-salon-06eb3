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
  formatWATime,
} from "@/app/lib/whatsapp";

// ─────────────────────────────────────────────────────────
// Use service-role key so RLS does not block cron reads
// ─────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const now = new Date();
  let sent = 0;
  const errors: string[] = [];

  // ── Time windows ──────────────────────────────────
  const w24h  = window15(now.getTime() + 24 * 60 * 60 * 1000);
  const w2h   = window15(now.getTime() +  2 * 60 * 60 * 1000);
  const w1hAgo = window15(now.getTime() -  1 * 60 * 60 * 1000);
  const w6wkAgo = window15(now.getTime() - 42 * 24 * 60 * 60 * 1000);

  // ════════════════════════════════════════════════════════
  // 1. 24h BEFORE — Appointment Reminder
  // ════════════════════════════════════════════════════════
  const { data: appts24 } = await supabase
    .from("appointments")
    .select("*, services(name,price), staff(name), salons(name,slug,reminders_enabled,whatsapp_enabled,review_link)")
    .eq("status", "confirmed")
    .eq("reminder_24h_sent", false)
    .gte("date_time", w24h.start)
    .lte("date_time", w24h.end);

  for (const a of appts24 || []) {
    if (!a.salons?.reminders_enabled) continue;

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
  const { data: appts2h } = await supabase
    .from("appointments")
    .select("*, services(name,price), staff(name), salons(name,slug,reminders_enabled,whatsapp_enabled)")
    .eq("status", "confirmed")
    .eq("reminder_2h_sent", false)
    .gte("date_time", w2h.start)
    .lte("date_time", w2h.end);

  for (const a of appts2h || []) {
    if (!a.salons?.reminders_enabled) continue;

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
  const { data: appts1hAgo } = await supabase
    .from("appointments")
    .select("*, services(name), salons(name,slug,reminders_enabled,review_link)")
    .eq("status", "confirmed")
    .eq("thankyou_1h_sent", false)
    .gte("date_time", w1hAgo.start)
    .lte("date_time", w1hAgo.end);

  for (const a of appts1hAgo || []) {
    if (!a.salons?.reminders_enabled) continue;

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

    await supabase
      .from("appointments")
      .update({ thankyou_1h_sent: true })
      .eq("id", a.id);
    sent++;
  }

  // ════════════════════════════════════════════════════════
  // 4. 6 WEEKS AFTER — Win-back
  // ════════════════════════════════════════════════════════
  const { data: appts6wk } = await supabase
    .from("appointments")
    .select("*, services(name), salons(name,slug,reminders_enabled,whatsapp_enabled)")
    .eq("status", "confirmed")
    .eq("winback_sent", false)
    .gte("date_time", w6wkAgo.start)
    .lte("date_time", w6wkAgo.end);

  for (const a of appts6wk || []) {
    if (!a.salons?.reminders_enabled) continue;

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

  return NextResponse.json({
    success: true,
    sent,
    errors: errors.length > 0 ? errors : undefined,
    checkedAt: now.toISOString(),
    timezone: "Europe/London",
  });
}