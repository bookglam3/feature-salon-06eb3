import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// ── Load .env.local ───────────────────────────────────────────────
const env = {};
readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .split("\n")
  .forEach(line => {
    const [k, ...rest] = line.split("=");
    if (k && rest.length) env[k.trim()] = rest.join("=").trim();
  });

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const COLS = [
  "id", "name",
  "subscription_status",
  "subscription_plan",
  "stripe_customer_id",
  "subscription_id",
  "trial_ends_at",
  "current_period_end",
  "updated_at",
];

const { data, error } = await supabase
  .from("salons")
  .select(COLS.join(","))
  .order("updated_at", { ascending: false })
  .limit(1)
  .single();

if (error) { console.error("Query error:", error.message); process.exit(1); }

console.log("\n=== Most recently updated salon ===");
console.log(`Name : ${data.name}`);
console.log(`ID   : ${data.id}`);
console.log(`Updated at: ${data.updated_at}\n`);

const checks = [
  ["subscription_status",  data.subscription_status,  v => ["trialing","active","trial"].includes(v)],
  ["subscription_plan",    data.subscription_plan,     v => v === "starter"],
  ["stripe_customer_id",   data.stripe_customer_id,    v => v?.startsWith("cus_")],
  ["subscription_id",      data.subscription_id,       v => v?.startsWith("sub_")],
  ["trial_ends_at",        data.trial_ends_at,         v => v && new Date(v) > new Date()],
  ["current_period_end",   data.current_period_end,    v => !!v],
];

for (const [col, val, ok] of checks) {
  const pass = val != null && ok(val);
  console.log(`${pass ? "✅" : "❌"} ${col.padEnd(22)} ${val ?? "(null)"}`);
}
