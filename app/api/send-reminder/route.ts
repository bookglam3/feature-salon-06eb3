import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { send24hReminder, send2hReminder, sendWinbackEmail } from "@/app/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  // Security check
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const now = new Date();
  let sent = 0;

  // ── Helper: 15 min window around target time ──
  const window = (targetMs: number) => ({
    start: new Date(targetMs - 15 * 60 * 1000).toISOString(),
    end:   new Date(targetMs + 15 * 60 * 1000).toISOString(),
  });

  const w24h = window(now.getTime() + 24 * 60 * 60 * 1000);
  const w2h  = window(now.getTime() +  2 * 60 * 60 * 1000);

  // ════════════════════════════════
  // 1. 24h Reminders
  // ════════════════════════════════
  const { data: appts24 } = await supabase
    .from("appointments")
    .select("*, services(name,price), staff(name), salons(name,slug)")
    .eq("status", "confirmed")
    .eq("reminder_24h_sent", false)
    .gte("date_time", w24h.start)
    .lte("date_time", w24h.end);

  for (const a of appts24 || []) {
    if (!a.client_email) continue;
    await send24hReminder({
      to: a.client_email,
      clientName: a.client_name,
      serviceName: a.services?.name || "Appointment",
      staffName: a.staff?.name,
      salonName: a.salons?.name || "Your Salon",
      dateTime: a.date_time,
      price: a.services?.price,
    });
    await supabase.from("appointments").update({ reminder_24h_sent: true }).eq("id", a.id);
    sent++;
  }

  // ════════════════════════════════
  // 2. 2h Reminders
  // ════════════════════════════════
  const { data: appts2h } = await supabase
    .from("appointments")
    .select("*, services(name,price), staff(name), salons(name,slug)")
    .eq("status", "confirmed")
    .eq("reminder_2h_sent", false)
    .gte("date_time", w2h.start)
    .lte("date_time", w2h.end);

  for (const a of appts2h || []) {
    if (!a.client_email) continue;
    await send2hReminder({
      to: a.client_email,
      clientName: a.client_name,
      serviceName: a.services?.name || "Appointment",
      staffName: a.staff?.name,
      salonName: a.salons?.name || "Your Salon",
      dateTime: a.date_time,
      price: a.services?.price,
    });
    await supabase.from("appointments").update({ reminder_2h_sent: true }).eq("id", a.id);
    sent++;
  }

  // ════════════════════════════════
  // 3. Win-back — 6 Weeks After Last Visit
  // ════════════════════════════════
  const sixWeeksAgo = new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000);
  const sixWeeksAgoStart = new Date(sixWeeksAgo.getTime() - 15 * 60 * 1000).toISOString();
  const sixWeeksAgoEnd   = new Date(sixWeeksAgo.getTime() + 15 * 60 * 1000).toISOString();

  const { data: oldAppts } = await supabase
    .from("appointments")
    .select("*, services(name), salons(name,slug)")
    .eq("status", "confirmed")
    .eq("winback_sent", false)
    .gte("date_time", sixWeeksAgoStart)
    .lte("date_time", sixWeeksAgoEnd);

  for (const a of oldAppts || []) {
    if (!a.client_email) continue;
    const bookingLink = `${process.env.NEXT_PUBLIC_APP_URL}/book/${a.salons?.slug}`;
    await sendWinbackEmail({
      to: a.client_email,
      clientName: a.client_name,
      salonName: a.salons?.name || "Your Salon",
      lastServiceName: a.services?.name,
      bookingLink,
    });
    await supabase.from("appointments").update({ winback_sent: true }).eq("id", a.id);
    sent++;
  }

  return NextResponse.json({
    success: true,
    emailsSent: sent,
    checkedAt: now.toISOString(),
  });
}