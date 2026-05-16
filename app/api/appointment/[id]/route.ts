import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Service-role client to bypass RLS (public reschedule page)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || "noreply@featuresalon.co.uk";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://featuresalon.co.uk";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("*, services(name,price), salon:salons(name,slug,owner_email)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { action, date_time, notes, note } = body;

  // Fetch appointment + salon for owner email
  const { data: appt } = await supabaseAdmin
    .from("appointments")
    .select("client_name, date_time, services(name), salon:salons(name,owner_email)")
    .eq("id", id)
    .single();

  if (action === "reschedule") {
    const { error } = await supabaseAdmin
      .from("appointments")
      .update({ date_time, status: "pending", notes })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Send email to owner server-side (no origin check issues)
    if (appt?.salon?.owner_email) {
      const fmt = (dt: string) => new Date(dt).toLocaleString("en-GB", {
        weekday: "short", day: "numeric", month: "long",
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
      });
      const serviceName = appt.services?.name || "";
      try {
        await resend.emails.send({
          from: FROM,
          to: appt.salon.owner_email,
          subject: `🔄 Appointment Rescheduled — ${appt.client_name} (${serviceName})`,
          html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F4F5;font-family:Arial,sans-serif;">
<div style="max-width:500px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
  <div style="background:linear-gradient(135deg,#4F46E5,#6366F1);padding:32px 28px;text-align:center;">
    <div style="font-size:40px;margin-bottom:8px;">🔄</div>
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Appointment Rescheduled</h1>
  </div>
  <div style="padding:28px;">
    <p style="font-size:14px;color:#475569;margin:0 0 16px;">A client has rescheduled their appointment.</p>
    <table style="width:100%;font-size:14px;border-collapse:collapse;background:#F8FAFC;border-radius:12px;overflow:hidden;">
      <tr><td style="padding:12px 16px;color:#64748B;border-bottom:1px solid #E2E8F0;">Client</td><td style="padding:12px 16px;font-weight:700;color:#0F172A;border-bottom:1px solid #E2E8F0;">${appt.client_name}</td></tr>
      <tr><td style="padding:12px 16px;color:#64748B;border-bottom:1px solid #E2E8F0;">Service</td><td style="padding:12px 16px;font-weight:700;color:#0F172A;border-bottom:1px solid #E2E8F0;">${serviceName || "—"}</td></tr>
      <tr><td style="padding:12px 16px;color:#64748B;border-bottom:1px solid #E2E8F0;">Original</td><td style="padding:12px 16px;font-weight:700;color:#0F172A;border-bottom:1px solid #E2E8F0;">${fmt(appt.date_time)}</td></tr>
      <tr><td style="padding:12px 16px;color:#64748B;">New Time</td><td style="padding:12px 16px;font-weight:700;color:#059669;">${fmt(date_time)}</td></tr>
      ${note ? `<tr><td colspan="2" style="padding:12px 16px;color:#64748B;border-top:1px solid #E2E8F0;"><em>"${note}"</em></td></tr>` : ""}
    </table>
    <div style="margin-top:20px;text-align:center;">
      <a href="${APP_URL}/dashboard/bookings" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#4F46E5,#6366F1);color:#fff;border-radius:10px;text-decoration:none;font-size:13px;font-weight:700;">View in Dashboard →</a>
    </div>
  </div>
</div></body></html>`,
        });
      } catch (e) { console.error("[appointment] Email error:", e); }
    }

    return NextResponse.json({ success: true });
  }

  if (action === "cancel") {
    const { error } = await supabaseAdmin
      .from("appointments")
      .update({ status: "cancelled", notes })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Send cancellation email to owner
    if (appt?.salon?.owner_email) {
      const fmt = (dt: string) => new Date(dt).toLocaleString("en-GB", {
        weekday: "short", day: "numeric", month: "long",
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
      });
      const serviceName = appt.services?.name || "";
      try {
        await resend.emails.send({
          from: FROM,
          to: appt.salon.owner_email,
          subject: `❌ Appointment Cancelled — ${appt.client_name} (${serviceName})`,
          html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F4F5;font-family:Arial,sans-serif;">
<div style="max-width:500px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
  <div style="background:linear-gradient(135deg,#DC2626,#B91C1C);padding:32px 28px;text-align:center;">
    <div style="font-size:40px;margin-bottom:8px;">❌</div>
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Appointment Cancelled</h1>
  </div>
  <div style="padding:28px;">
    <p style="font-size:14px;color:#475569;margin:0 0 16px;">A client has cancelled their appointment.</p>
    <table style="width:100%;font-size:14px;border-collapse:collapse;background:#F8FAFC;border-radius:12px;overflow:hidden;">
      <tr><td style="padding:12px 16px;color:#64748B;border-bottom:1px solid #E2E8F0;">Client</td><td style="padding:12px 16px;font-weight:700;color:#0F172A;border-bottom:1px solid #E2E8F0;">${appt.client_name}</td></tr>
      <tr><td style="padding:12px 16px;color:#64748B;border-bottom:1px solid #E2E8F0;">Service</td><td style="padding:12px 16px;font-weight:700;color:#0F172A;border-bottom:1px solid #E2E8F0;">${serviceName || "—"}</td></tr>
      <tr><td style="padding:12px 16px;color:#64748B;">Date</td><td style="padding:12px 16px;font-weight:700;color:#0F172A;">${fmt(appt.date_time)}</td></tr>
      ${note ? `<tr><td colspan="2" style="padding:12px 16px;color:#64748B;border-top:1px solid #E2E8F0;"><em>"${note}"</em></td></tr>` : ""}
    </table>
    <div style="margin-top:16px;padding:14px 16px;background:#FEF2F2;border-radius:10px;font-size:13px;color:#DC2626;font-weight:600;">
      ⚠️ This slot is now free — you may want to offer it to another client.
    </div>
    <div style="margin-top:20px;text-align:center;">
      <a href="${APP_URL}/dashboard/bookings" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#DC2626,#B91C1C);color:#fff;border-radius:10px;text-decoration:none;font-size:13px;font-weight:700;">View in Dashboard →</a>
    </div>
  </div>
</div></body></html>`,
        });
      } catch (e) { console.error("[appointment] Cancel email error:", e); }
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
