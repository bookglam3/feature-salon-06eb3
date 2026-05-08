/**
 * TEST REMINDER END-TO-END
 * ─────────────────────────────────────────────────────────
 * 1. Finds the first salon in Supabase
 * 2. Finds/creates a service in that salon
 * 3. Inserts a test appointment exactly 24h from now
 *    (so it falls inside the ±15-min cron window)
 * 4. Calls the PRODUCTION reminder API
 * 5. Verifies sent=1 and cleans up the test appointment
 *
 * Run: node test-end-to-end-reminder.mjs
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// ── Parse .env.local
try {
  const raw = readFileSync(".env.local", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (k && !process.env[k]) process.env[k] = v;
  }
} catch { /* already in env */ }

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service-role if available, fall back to anon for INSERT
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY !== "PASTE_SERVICE_ROLE_KEY_HERE"
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CRON_SECRET   = process.env.CRON_SECRET;
const APP_URL       = (process.env.NEXT_PUBLIC_APP_URL || "https://feature-saas.vercel.app").replace(/\/$/, "");

const TEST_EMAIL    = "bookglam3@gmail.com";
const TEST_PHONE    = "+923464503668";
const TEST_NAME     = "Test Reminder Client";

console.log("\n══════════════════════════════════════════════════════");
console.log("  END-TO-END REMINDER TEST");
console.log("══════════════════════════════════════════════════════");
console.log(`  Email:    ${TEST_EMAIL}`);
console.log(`  Phone:    ${TEST_PHONE}`);
console.log(`  WhatsApp: ${TEST_PHONE}`);
console.log(`  API:      ${APP_URL}/api/send-reminder`);
console.log("══════════════════════════════════════════════════════\n");

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── 1. Get first salon
console.log("1️⃣  Fetching salon...");
const { data: anySalon, error: sErr } = await sb
  .from("salons")
  .select("id, name")
  .limit(1)
  .single();

if (sErr || !anySalon) {
  console.log("❌ No salons found:", sErr?.message);
  process.exit(1);
}
const salon = anySalon;
console.log(`   ✅ Salon: "${salon.name}" (id=${salon.id})`);

// Check migration columns separately (don't fail if missing)
const { data: extCols } = await sb
  .from("salons")
  .select("reminders_enabled, whatsapp_enabled")
  .eq("id", salon.id)
  .single();

const remindersEnabled  = extCols?.reminders_enabled;
const whatsappEnabled   = extCols?.whatsapp_enabled;
console.log(`   ℹ️  reminders_enabled=${remindersEnabled ?? "⚠️ column missing — run supabase-reminders-migration.sql"}`);
console.log(`   ℹ️  whatsapp_enabled=${whatsappEnabled ?? "⚠️ column missing — run supabase-whatsapp-migration.sql"}`);

if (remindersEnabled === false) {
  console.log("   ⚠️  Enabling reminders for this test...");
  await sb.from("salons").update({ reminders_enabled: true }).eq("id", salon.id);
}

// ── 2. Get or create a service
console.log("\n2️⃣  Getting service...");
const { data: services } = await sb
  .from("services")
  .select("id, name, price")
  .eq("salon_id", salon.id)
  .limit(1);

let serviceId, serviceName, servicePrice;
if (services?.length) {
  serviceId    = services[0].id;
  serviceName  = services[0].name;
  servicePrice = services[0].price;
  console.log(`   ✅ Using existing service: "${serviceName}" (£${servicePrice})`);
} else {
  const { data: newSvc } = await sb.from("services").insert({
    salon_id: salon.id, name: "Test Cut", price: 30, duration: 45,
  }).select().single();
  serviceId    = newSvc.id;
  serviceName  = newSvc.name;
  servicePrice = newSvc.price;
  console.log(`   ✅ Created test service: "${serviceName}"`);
}

// ── 3. Create test appointment exactly 24h from now (inside ±15min window)
const apptTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
// Round to nearest minute for clarity
apptTime.setSeconds(0, 0);
const isoTime = apptTime.toISOString();

console.log(`\n3️⃣  Creating test appointment at ${isoTime}...`);
const { data: appt, error: apptErr } = await sb
  .from("appointments")
  .insert({
    salon_id:       salon.id,
    service_id:     serviceId,
    client_name:    TEST_NAME,
    client_email:   TEST_EMAIL,
    client_phone:   TEST_PHONE,
    date_time:      isoTime,
    status:         "confirmed",
    payment_status: "paid",
    reminder_24h_sent: false,
    reminder_2h_sent:  false,
    thankyou_1h_sent:  false,
    winback_sent:      false,
  })
  .select()
  .single();

if (apptErr || !appt) {
  console.log("❌ Failed to create appointment:", apptErr?.message);
  process.exit(1);
}
console.log(`   ✅ Appointment created: id=${appt.id}`);
console.log(`   📅 Time: ${apptTime.toLocaleString("en-GB", { timeZone: "Europe/London" })} (London)`);

// ── 4. Call production reminder API
const apiUrl = `${APP_URL}/api/send-reminder?secret=${CRON_SECRET}`;
console.log(`\n4️⃣  Triggering production reminder API...`);
console.log(`   GET ${apiUrl.replace(CRON_SECRET, "***")}`);

let apiResult = null;
try {
  const res = await fetch(apiUrl);
  const text = await res.text();
  console.log(`   HTTP ${res.status}`);
  try {
    apiResult = JSON.parse(text);
    console.log("   Response:", JSON.stringify(apiResult, null, 4));
  } catch {
    console.log("   Raw:", text.slice(0, 500));
  }
} catch (err) {
  console.log("   ❌ Fetch error:", err.message);
}

// ── 5. Verify DB was updated
console.log("\n5️⃣  Checking appointment was marked as sent...");
await new Promise(r => setTimeout(r, 2000)); // brief pause
const { data: updated } = await sb
  .from("appointments")
  .select("reminder_24h_sent, whatsapp_24h_sent")
  .eq("id", appt.id)
  .single();

console.log(`   reminder_24h_sent:  ${updated?.reminder_24h_sent}`);
console.log(`   whatsapp_24h_sent:  ${updated?.whatsapp_24h_sent}`);

// ── 6. Cleanup
console.log("\n6️⃣  Cleaning up test appointment...");
const { error: delErr } = await sb.from("appointments").delete().eq("id", appt.id);
if (delErr) console.log("   ⚠️  Cleanup failed:", delErr.message);
else        console.log("   ✅ Test appointment deleted");

// ── Summary
console.log("\n══════════════════════════════════════════════════════");
if (apiResult?.sent > 0) {
  console.log(`  ✅ SUCCESS — ${apiResult.sent} reminder(s) sent!`);
  console.log(`  📧 Email sent to:    ${TEST_EMAIL}`);
  console.log(`  📱 SMS sent to:      ${TEST_PHONE}`);
  if (salon.whatsapp_enabled) {
    console.log(`  💚 WhatsApp sent to: ${TEST_PHONE}`);
  } else {
    console.log(`  ⚠️  WhatsApp SKIPPED — salon whatsapp_enabled=false`);
    console.log(`     Enable it: Dashboard → Settings → WhatsApp Reminders → ON`);
  }
  if (apiResult.errors?.length) {
    console.log(`  ⚠️  Partial errors:`);
    apiResult.errors.forEach(e => console.log(`     • ${e}`));
  }
} else if (apiResult?.sent === 0) {
  console.log("  ⚠️  0 reminders sent.");
  console.log("  This usually means:");
  console.log("  • SUPABASE_SERVICE_ROLE_KEY not set in Vercel env vars");
  console.log("  • The appointment wasn't found in the ±15min window");
  console.log("  • reminders_enabled=false on the salon");
  if (apiResult?.errors?.length) {
    console.log("  Errors:", apiResult.errors);
  }
} else {
  console.log("  ❌ API did not return a valid response.");
}
console.log("══════════════════════════════════════════════════════\n");
