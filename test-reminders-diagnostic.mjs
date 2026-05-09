/**
 * REMINDER SYSTEM DIAGNOSTIC — no external deps
 * Run: node test-reminders-diagnostic.mjs
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// ── Parse .env.local manually (no dotenv needed)
try {
  const raw = readFileSync(".env.local", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
  console.log("✅ Loaded .env.local");
} catch {
  console.log("ℹ️  .env.local not found — using existing env");
}

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "CRON_SECRET",
  "NEXT_PUBLIC_APP_URL",
];

console.log("\n══════════════════════════════════════════════");
console.log("  REMINDER SYSTEM DIAGNOSTIC");
console.log("══════════════════════════════════════════════\n");

// ── 1. Env check
console.log("1️⃣  Environment variables:");
let envOk = true;
for (const v of REQUIRED) {
  const val = process.env[v];
  const missing = !val || val === "PASTE_SERVICE_ROLE_KEY_HERE";
  console.log(`   ${missing ? "❌" : "✅"} ${v}: ${missing ? "MISSING" : val.slice(0, 28) + "..."}`);
  if (missing) envOk = false;
}
console.log(`   ℹ️  TWILIO_WHATSAPP_FROM: ${process.env.TWILIO_WHATSAPP_FROM || "not set"}`);

if (!envOk) {
  console.log("\n❌ Fix missing env vars first.\n");
  process.exit(1);
}

// ── 2. Supabase connection
console.log("\n2️⃣  Testing Supabase (service-role)...");
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: salons, error: salErr } = await sb
  .from("salons")
  .select("id,name,reminders_enabled,whatsapp_enabled")
  .limit(5);

if (salErr) { console.log("❌ Supabase error:", salErr.message); process.exit(1); }
console.log(`✅ Connected. ${salons.length} salon(s):`);
salons.forEach(s =>
  console.log(`   • ${s.name} — reminders=${s.reminders_enabled ?? "NULL"} wa=${s.whatsapp_enabled ?? "NULL"}`)
);

// ── 3. Appointment windows
console.log("\n3️⃣  Appointment reminder windows:");
const now = Date.now();
const win = (ms) => ({
  start: new Date(ms - 15*60*1000).toISOString(),
  end:   new Date(ms + 15*60*1000).toISOString(),
});
const windows = [
  { label: "24h before", w: win(now + 24*60*60*1000),      col: "reminder_24h_sent" },
  { label: "2h before",  w: win(now +  2*60*60*1000),      col: "reminder_2h_sent"  },
  { label: "1h after",   w: win(now -  1*60*60*1000),      col: "thankyou_1h_sent"  },
  { label: "6wk after",  w: win(now - 42*24*60*60*1000),   col: "winback_sent"      },
];
for (const { label, w, col } of windows) {
  const { data, error } = await sb
    .from("appointments")
    .select("id,client_name,client_email,client_phone,date_time")
    .eq("status", "confirmed")
    .eq(col, false)
    .gte("date_time", w.start)
    .lte("date_time", w.end);
  if (error) { console.log(`   ❌ ${label}: ${error.message}`); continue; }
  console.log(`   ${data.length ? "📬" : "📭"} ${label}: ${data.length} due`);
  data.forEach(a => console.log(`      → ${a.client_name} | ${a.client_email} | ${a.client_phone} | ${a.date_time}`));
}

// ── 4. Hit the API
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
const apiUrl = `${appUrl}/api/send-reminder?secret=${process.env.CRON_SECRET}`;
console.log(`\n4️⃣  Calling API: GET ${apiUrl.replace(process.env.CRON_SECRET, "***SECRET***")}`);
try {
  const res = await fetch(apiUrl);
  const text = await res.text();
  console.log(`   HTTP ${res.status}`);
  try {
    const json = JSON.parse(text);
    console.log("   Response:", JSON.stringify(json, null, 4));
    if (res.status === 401)      console.log("\n❌ CRON_SECRET mismatch — check Vercel env vars");
    else if (res.status === 500) console.log("\n❌ Server error — check Vercel function logs for [Reminder]");
    else if (json.sent === 0)    console.log("\nℹ️  0 reminders sent — no appointments in any window right now (normal)");
    else                         console.log(`\n✅ ${json.sent} reminder(s) sent!`);
    if (json.errors?.length)     console.log("⚠️  Errors:", json.errors);
  } catch { console.log("   Raw:", text.slice(0, 500)); }
} catch (err) {
  console.log("   ❌ Fetch error:", err.message);
}

console.log("\n══════════════════════════════════════════════\n");
