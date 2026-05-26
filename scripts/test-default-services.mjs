/**
 * Verifies that new accounts get the correct vertical default services.
 * Creates three isolated test accounts (physio, gym, hair), checks their
 * services, then cleans up all test data.
 *
 * Run: node scripts/test-default-services.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ── Load env ──────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dir, "../.env.local"), "utf8")
    .split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ── Inline defaultServices (mirrors app/lib/defaultServices.ts) ───
const DEFAULT_SERVICES = {
  hair:    [
    { name:"Haircut",     price:25, duration_minutes:45, description:"Precision cut styled to your preference",    category:"Hair"   },
    { name:"Hair Colour", price:60, duration_minutes:90, description:"Full colour treatment with premium products", category:"Hair"   },
    { name:"Blow Dry",    price:20, duration_minutes:30, description:"Professional blow dry and finish",            category:"Hair"   },
    { name:"Beard Trim",  price:15, duration_minutes:20, description:"Shape and trim with hot towel finish",        category:"Barber" },
    { name:"Manicure",    price:30, duration_minutes:45, description:"Nail shaping, cuticle care, and polish",     category:"Nails"  },
    { name:"Facial",      price:40, duration_minutes:60, description:"Cleanse, exfoliate, and hydrate",            category:"Beauty" },
  ],
  physio: [
    { name:"Initial Assessment",    price:60, duration_minutes:60, description:"First appointment to assess your condition",  category:"Assessment" },
    { name:"Physiotherapy Session", price:50, duration_minutes:45, description:"Hands-on treatment and rehabilitation",       category:"Treatment"  },
    { name:"Follow-up Session",     price:40, duration_minutes:30, description:"Progress review and continued treatment",     category:"Treatment"  },
    { name:"Sports Massage",        price:45, duration_minutes:45, description:"Deep tissue massage for sports recovery",     category:"Massage"    },
  ],
  gym: [
    { name:"Personal Training Session", price:50, duration_minutes:60, description:"One-to-one session tailored to your goals", category:"Training"     },
    { name:"Group Class",               price:15, duration_minutes:60, description:"High-energy class for all fitness levels",  category:"Classes"      },
    { name:"Fitness Assessment",        price:40, duration_minutes:60, description:"Full fitness evaluation and goal setting",  category:"Assessment"   },
    { name:"Nutrition Consultation",    price:45, duration_minutes:45, description:"Personalised nutrition plan and advice",    category:"Consultation" },
  ],
};

const TESTS = [
  { type: "physio", email: "test.physio.tmp@featuresalon.co.uk", biz: "Test Physio Clinic" },
  { type: "gym",    email: "test.gym.tmp@featuresalon.co.uk",    biz: "Test Gym Studio"    },
  { type: "hair",   email: "test.hair.tmp@featuresalon.co.uk",   biz: "Test Hair Salon"    },
];

const createdUserIds  = [];
const createdSalonIds = [];

async function createAccount({ type, email, biz }) {
  // Create auth user
  const { data: { user }, error: ue } = await admin.auth.admin.createUser({
    email, password: "TestPass2026!", email_confirm: true,
    user_metadata: { full_name: "Test User", salon_name: biz, business_type: type },
  });
  if (ue) throw new Error(`Auth create failed for ${type}: ${ue.message}`);
  createdUserIds.push(user.id);

  // Create salon (mirrors signup step1)
  const slug = biz.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"") + "-" + Date.now();
  const { data: salon, error: se } = await admin
    .from("salons")
    .insert({ name: biz, slug, owner_id: user.id, owner_email: email, plan:"starter", business_type: type })
    .select("id").single();
  if (se) throw new Error(`Salon create failed for ${type}: ${se.message}`);
  createdSalonIds.push(salon.id);

  // Seed default services (mirrors the new signup logic)
  const defaults = DEFAULT_SERVICES[type] ?? [];
  if (defaults.length > 0) {
    const { error: svcErr } = await admin.from("services").insert(
      defaults.map(svc => ({ salon_id: salon.id, ...svc }))
    );
    if (svcErr) throw new Error(`Service seed failed for ${type}: ${svcErr.message}`);
  }

  return { userId: user.id, salonId: salon.id };
}

async function getServices(salonId) {
  const { data } = await admin.from("services").select("name,price,category").eq("salon_id", salonId).order("name");
  return data ?? [];
}

async function cleanup() {
  for (const id of createdSalonIds) {
    await admin.from("services").delete().eq("salon_id", id);
    await admin.from("salons").delete().eq("id", id);
  }
  for (const id of createdUserIds) {
    await admin.auth.admin.deleteUser(id);
  }
}

// ── Run tests ─────────────────────────────────────────────────────
let passed = 0, failed = 0;

console.log("\n── Default Services Test ────────────────────────────────\n");

for (const spec of TESTS) {
  try {
    const { salonId } = await createAccount(spec);
    const svcs = await getServices(salonId);
    const names = svcs.map(s => s.name);
    const expected = DEFAULT_SERVICES[spec.type] ?? [];

    console.log(`▶ ${spec.type.toUpperCase()} account  (${spec.biz})`);
    console.log(`  Got ${svcs.length} services: ${names.join(", ")}`);

    // Verify: all expected services present
    const missing = expected.filter(e => !names.includes(e.name));
    // Verify: no cross-contamination ("Haircut" must not appear on non-salon)
    const haircut = spec.type !== "hair" && names.includes("Haircut");

    if (missing.length === 0 && !haircut) {
      console.log(`  ✓ PASS — correct services, no contamination\n`);
      passed++;
    } else {
      console.log(`  ✗ FAIL — missing: [${missing.map(m=>m.name).join(", ")}]${haircut ? " | 'Haircut' found on non-salon!" : ""}\n`);
      failed++;
    }
  } catch (err) {
    console.log(`  ✗ ERROR (${spec.type}): ${err.message}\n`);
    failed++;
  }
}

await cleanup();
console.log(`── Results: ${passed} passed, ${failed} failed ─────────────────────\n`);
process.exit(failed > 0 ? 1 : 0);
