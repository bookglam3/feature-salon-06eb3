/**
 * Live Stripe end-to-end subscription test
 * Usage: STRIPE_LIVE_KEY=sk_live_... node scripts/live-stripe-test.mjs
 *
 * NEVER hardcode the key. NEVER commit this script with a key in it.
 * Cleanup runs in a finally block so test data is removed even on failure.
 */

import Stripe from "stripe";

const key = process.env.STRIPE_LIVE_KEY;
if (!key || !key.startsWith("sk_live_")) {
  console.error("❌ STRIPE_LIVE_KEY env var missing or not a live key (must start sk_live_)");
  process.exit(1);
}

const stripe = new Stripe(key);

const PRICES = [
  { id: "price_1ToFuaCymK8uN5qzlpK9qII1", label: "Starter", expectGBP: 29 },
  { id: "price_1ToGa8CymK8uN5qzmjZDq7Zj", label: "Pro",     expectGBP: 59 },
  { id: "price_1ToGbWCymK8uN5qzvMF6iFNh", label: "Business", expectGBP: 99 },
];

function pass(msg) { console.log(`  ✅ PASS  ${msg}`); }
function fail(msg) { console.log(`  ❌ FAIL  ${msg}`); }
function step(n, msg) { console.log(`\n── Step ${n}: ${msg}`); }

let customerId = null;
let subId      = null;

try {
  // ── Step 1: Verify live prices ────────────────────────────────────────────
  step(1, "Verify live price IDs + amounts");
  for (const p of PRICES) {
    try {
      const price = await stripe.prices.retrieve(p.id);
      const amountGBP = (price.unit_amount ?? 0) / 100;
      const currency  = price.currency?.toUpperCase();
      const interval  = price.recurring?.interval;
      const line      = `${p.label}: ${currency} ${amountGBP}/${interval} (id: ${p.id})`;
      if (currency === "GBP" && amountGBP === p.expectGBP && interval === "month") {
        pass(line);
      } else {
        fail(`${line}  — expected GBP ${p.expectGBP}/month`);
      }
    } catch (e) {
      fail(`${p.label} (${p.id}): ${e.message}`);
    }
  }

  // ── Step 2: Create test customer ──────────────────────────────────────────
  step(2, "Create live test customer");
  const customer = await stripe.customers.create({
    email: "livetest@featuresalon.co.uk",
    name:  "Live Test",
  });
  customerId = customer.id;
  pass(`customer.id = ${customerId}`);

  // ── Step 3: Attach test payment method ────────────────────────────────────
  step(3, "Attach pm_card_visa + set as default");
  let pmAttached = false;
  try {
    await stripe.paymentMethods.attach("pm_card_visa", { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: "pm_card_visa" },
    });
    pass("pm_card_visa attached and set as default");
    pmAttached = true;
  } catch (e) {
    // Live mode does not accept Stripe test tokens (pm_card_visa is test-only)
    fail(`pm_card_visa rejected in live mode: ${e.message}`);
    console.log("  ℹ️  Expected in live mode — test PMs (pm_card_visa) only work in test mode.");
    console.log("     Trial subscription can still be created (no charge during trial).");
  }

  // ── Step 4: Create subscription with 14-day trial ────────────────────────
  step(4, "Create Starter subscription (14-day trial, no charge)");
  const sub = await stripe.subscriptions.create({
    customer:          customerId,
    items:             [{ price: PRICES[0].id }],
    trial_period_days: 14,
    metadata:          { salon_id: "TEST_LIVE" },
  });
  subId = sub.id;
  pass(`subscription.id = ${subId}`);
  pass(`status = ${sub.status}`);

  // ── Step 5: Wait 6s then retrieve + validate ─────────────────────────────
  step(5, "Wait 6s then retrieve subscription");
  await new Promise(r => setTimeout(r, 6000));

  const retrieved = await stripe.subscriptions.retrieve(subId);

  const periodEndTs = retrieved.current_period_end
    ?? retrieved.items?.data?.[0]?.current_period_end;

  const checks = [
    ["status === 'trialing'",      retrieved.status === "trialing"],
    ["id starts with 'sub_'",      retrieved.id?.startsWith("sub_")],
    ["current_period_end set",     !!periodEndTs],
  ];
  for (const [label, ok] of checks) {
    ok ? pass(label) : fail(label);
  }
  console.log(`\n  Values:`);
  console.log(`    status            : ${retrieved.status}`);
  console.log(`    id                : ${retrieved.id}`);
  console.log(`    trial_end         : ${retrieved.trial_end ? new Date(retrieved.trial_end * 1000).toISOString() : null}`);
  console.log(`    current_period_end: ${periodEndTs ? new Date(Number(periodEndTs) * 1000).toISOString() : null}`);

} finally {
  // ── Step 6: Cleanup ───────────────────────────────────────────────────────
  step(6, "Cleanup (cancel sub + delete customer)");
  if (subId) {
    try {
      await stripe.subscriptions.cancel(subId);
      pass(`subscription ${subId} cancelled`);
    } catch (e) {
      fail(`cancel subscription: ${e.message}`);
    }
  }
  if (customerId) {
    try {
      await stripe.customers.del(customerId);
      pass(`customer ${customerId} deleted`);
    } catch (e) {
      fail(`delete customer: ${e.message}`);
    }
  }
  console.log("\n── Done ──\n");
}
