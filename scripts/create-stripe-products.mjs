// Creates Stripe subscription products and prices for all 3 plans
// Run: node scripts/create-stripe-products.mjs
// Then copy the price IDs into your .env.local and Vercel env vars

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error("STRIPE_SECRET_KEY env var required. Run: STRIPE_SECRET_KEY=sk_... node scripts/create-stripe-products.mjs");

const stripe = new Stripe(key);

const PLANS = [
  { name: "Starter",  price: 2900, description: "Up to 50 bookings/mo, 1 staff, basic analytics" },
  { name: "Pro",      price: 5900, description: "Unlimited bookings, 5 staff, SMS+Email, priority support" },
  { name: "Business", price: 9900, description: "Unlimited everything, 15 staff, revenue reports, API access" },
];

console.log("Creating Stripe products and prices...\n");

const priceIds = {};

for (const plan of PLANS) {
  const product = await stripe.products.create({
    name: `Feature Salon — ${plan.name}`,
    description: plan.description,
    metadata: { plan: plan.name.toLowerCase() },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.price,
    currency: "gbp",
    recurring: { interval: "month" },
    nickname: `${plan.name} Monthly`,
    metadata: { plan: plan.name.toLowerCase() },
  });

  priceIds[plan.name.toLowerCase()] = price.id;
  console.log(`✅ ${plan.name}: product=${product.id}  price=${price.id}`);
}

console.log("\n─────────────────────────────────────────");
console.log("Add these to .env.local and Vercel env vars:");
console.log("─────────────────────────────────────────");
console.log(`STRIPE_STARTER_PRICE_ID=${priceIds.starter}`);
console.log(`STRIPE_PRO_PRICE_ID=${priceIds.pro}`);
console.log(`STRIPE_BUSINESS_PRICE_ID=${priceIds.business}`);
console.log("─────────────────────────────────────────\n");
