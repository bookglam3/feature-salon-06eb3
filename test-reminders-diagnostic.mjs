/**
 * REMINDER SYSTEM DIAGNOSTIC SCRIPT
 * -----------------------------------
 * Run: node test-reminders-diagnostic.mjs
 *
 * Checks:
 *  1. All required env vars present
 *  2. Supabase service-role connection
 *  3. Whether any appointments are in the reminder windows
 *  4. Calls /api/send-reminder and shows full response
 */

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// ── Load env from .env.local manually (dotenv reads .env by default)
import { readFileSync } from "fs";
try {
  const raw = readFileSync(".env.local", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch { /* .env.local not found — already in env */ }

const REQUIRED_VARS = [
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
console.log("1️⃣  Checking environment variables...");
let envOk = true;
for (const v of REQUIRED_VARS) {
  const val = process.env[v];
  const ok = val && val !== "PASTE_SERVICE_ROLE_KEY_HERE";
  console.log(`   ${ok ? "✅" : "❌"} ${v}: ${ok ? val.slice(0, 20) + "..." : "MISSING or placeholder"}`);
  if (!ok) envOk = false;
}
console.log(`   ℹ️  TWILIO_WHATSAPP_FROM: ${process.env.TWILIO_WHATSAPP_FROM || "not set (WhatsApp disabled)"}`);

if (!envOk) {
  console.log("\n❌ Fix missing env vars above before continuing.\n");
  process.exit(1);
}

// ── 2. Supabase connection test
console.log("\n2️⃣  Testing Supabase service-role connection...");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: salons, error: salonsErr } = await supabase
  .from("salons")
  .select("id, name, reminders_enabled, whatsapp_enabled")
  .limit(5);

if (salonsErr) {
  console.log("❌ Supabase error:", salonsErr.message);
  process.exit(1);
}
console.log(`✅ Supabase connected. Found ${salons.length} salon(s):`);
salons.forEach(s => console.log(`   • ${s.name} — reminders_enabled=${s.reminders_enabled}, whatsapp_enabled=${s.whatsapp_enabled}`));

// ── 3. Appointment window check
console.log("\n3️⃣  Checking appointments in reminder windows...");
const now = Date.now();
function window15(ms) {
  return { start: new Date(ms - 15*60*1000).toISOString(), end: new Date(ms + 15*60*1000).toISOString() };
}
const w24h   = window15(now + 24*60*60*1000);
const w2h    = window15(now +  2*60*60*1000);
const w1hAgo = window15(now -  1*60*60*1000);
const w6wkAgo = window15(now - 42*24*60*60*1000);

for (const [label, w, col] of [
  ["24h before", w24h, "reminder_24h_sent"],
  ["2h before",  w2h,  "reminder_2h_sent"],
  ["1h after",   w1hAgo, "thankyou_1h_sent"],
  ["6wk after",  w6wkAgo, "winback_sent"],
]) {
  const { data, error } = await supabase
    .from("appointments")
    .select("id, client_name, client_email, client_phone, date_time, status")
    .eq("status", "confirmed")
    .eq(col, false)
    .gte("date_time", w.start)
    .lte("date_time", w.end);

  if (error) {
    console.log(`   ❌ ${label}: query error — ${error.message}`);
  } else {
    console.log(`   ${data.length > 0 ? "📬" : "📭"} ${label}: ${data.length} appointment(s) due`);
    data.forEach(a => console.log(`      → ${a.client_name} (${a.client_email}) at ${a.date_time}`));
  }
}

// ── 4. Hit the actual API endpoint
const appUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
const cronUrl = `${appUrl}/api/send-reminder?secret=${process.env.CRON_SECRET}`;
console.log(`\n4️⃣  Calling: GET ${cronUrl.replace(process.env.CRON_SECRET, "***")}`);

try {
  const res = await fetch(cronUrl);
  const json = await res.json();
  console.log(`   HTTP ${res.status}`);
  console.log("   Response:", JSON.stringify(json, null, 2));

  if (res.status === 401) {
    console.log("\n❌ CRON_SECRET mismatch — make sure CRON_SECRET in Vercel matches .env.local");
  } else if (res.status === 500) {
    console.log("\n❌ Server error — check Vercel function logs for [Reminder] messages");
  } else if (json.sent === 0 && !json.errors) {
    console.log("\nℹ️  No reminders sent — no appointments fell in any time window right now.");
    console.log("   This is normal. Create a test appointment 24h from now, then re-run.");
  } else if (json.errors?.length) {
    console.log("\n⚠️  Errors returned:", json.errors);
  } else {
    console.log(`\n✅ Success! ${json.sent} reminder(s) sent.`);
  }
} catch (err) {
  console.log("   ❌ Fetch failed:", err.message);
  console.log("   Is the dev server running? (npm run dev)");
}

console.log("\n══════════════════════════════════════════════\n");
