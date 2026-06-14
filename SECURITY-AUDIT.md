# SECURITY AUDIT — featuresalon.co.uk
**Date:** 2026-06-14  
**Auditor:** Claude (Senior AppSec pass)  
**Stack:** Next.js 15 + Supabase + Stripe + Vercel + Resend + Twilio  
**Scope:** Full codebase — secrets, auth, API routes, payments, headers, deps, injection

---

## EXECUTIVE SUMMARY

**Overall Risk Level: 🟠 HIGH**

No hardcoded secrets found in source code. Supabase service role key is correctly
server-side only. However there are **3 critical issues** that could allow an attacker
to fake payments, forge OTP tokens, or bypass payment amounts entirely — and **3 high
issues** including missing middleware protection and incomplete security headers.

All issues are fixable without breaking existing functionality.

---

## 🔴 CRITICAL ISSUES (Fix immediately)

---

### C1 — Stripe Webhook Accepts Unsigned Events if Secret Missing
**File:** `app/api/stripe-webhook/route.ts` lines 16–25  
**Risk:** Payment fraud, subscription manipulation

```typescript
// CURRENT — DANGEROUS FALLBACK:
if (webhookSecret) {
  event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
} else {
  event = JSON.parse(body) as Stripe.Event; // ← accepts ANY payload
}
```

If `STRIPE_WEBHOOK_SECRET` is not set in Vercel env vars, the webhook accepts
**any POST body** with no signature check. An attacker can POST a fake
`payment_intent.succeeded` event and get their subscription activated for free,
or fake `customer.subscription.created` to unlock Business plan.

**Fix:** Remove the else branch. Hard-fail if secret is missing.

```typescript
// PROPOSED FIX:
if (!webhookSecret) {
  console.error("[webhook] STRIPE_WEBHOOK_SECRET not configured — rejecting all events");
  return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
}
event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
```

---

### C2 — Payment Amount Trusted from Client Body
**File:** `app/api/create-payment-intent/route.ts` lines 17–30  
**Risk:** User pays £0.01 for any service

```typescript
const { amount, charge_amount, ... } = await req.json(); // ← from client
const chargeAmount = charge_amount
  ? Math.round(charge_amount * 100)           // ← client-controlled
  : Math.round(amount * 100);                 // ← client-controlled
```

A client can POST `{ "amount": 0.01, "booking_id": "...", "salon_id": "..." }`
and create a PaymentIntent for 1p. There is no server-side lookup of the
service's actual price from the database before charging.

**Fix:** Fetch the price from `services` table server-side using the `booking_id`.
Never trust a monetary amount from the client.

```typescript
// PROPOSED FIX:
const { booking_id, email, deposit_only, salon_id } = await req.json();
// Fetch actual price from DB — never from client
const { data: appt } = await supabaseAdmin
  .from("appointments")
  .select("services(price)")
  .eq("id", booking_id)
  .single();
const servicePrice = appt?.services?.price;
if (!servicePrice) return NextResponse.json({ error: "Service not found" }, { status: 400 });
const chargeAmount = deposit_only
  ? Math.round(servicePrice * 0.5 * 100)
  : Math.round(servicePrice * 100);
```

---

### C3 — OTP HMAC Falls Back to Predictable Secret
**File:** `app/api/auth/send-pw-otp/route.ts` line 19  
**File:** `app/api/auth/verify-pw-otp/route.ts` line 14  
**Risk:** Attacker forges OTP challenge tokens and bypasses password change verification

```typescript
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret";
```

If `SUPABASE_SERVICE_ROLE_KEY` is absent from env, the HMAC signing key becomes
the literal string `"fallback-secret"`. An attacker who reads this source code
(it's on GitHub) can compute valid challenge tokens for any user ID and any OTP
code, bypassing the email verification step entirely.

**Fix:** Hard-fail if the key is missing. Use a dedicated `OTP_SECRET` env var.

```typescript
// PROPOSED FIX (both files):
const secret = process.env.OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!secret) {
  console.error("[pw-otp] OTP_SECRET not configured");
  return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
}
```

Add `OTP_SECRET=<random 32-char string>` to Vercel env vars.

---

## 🟠 HIGH ISSUES

---

### H1 — No Middleware — All Private Routes Unprotected at Edge
**File:** `middleware.ts` — DOES NOT EXIST  
**Risk:** Dashboard pages accessible without authentication at the SSR level

There is no `middleware.ts`. All route protection depends on:
- Client-side redirects in React components (bypassable with JS disabled / direct API calls)
- Per-route manual auth checks (inconsistent)

Any user who knows a dashboard URL can SSR-render it. On pages where the auth
check is client-only, initial HTML may contain sensitive UI/data before the redirect fires.

**Fix:** Add `middleware.ts` at root to validate Supabase session on all
`/dashboard/*` and `/admin/*` routes server-side. (Additive — won't break anything.)

---

### H2 — Admin Login Has No Rate Limiting (Brute Force)
**File:** `app/api/admin/auth/route.ts`  
**Risk:** Unlimited password attempts — admin account can be brute-forced

`POST /api/admin/auth` accepts unlimited login attempts with no delay, lockout,
or rate limiting. A script can try thousands of passwords per minute.

**Fix:** Add in-memory or Upstash rate limiter: max 5 attempts per IP per 15 minutes.

---

### H3 — Missing Critical Security Headers
**File:** `next.config.ts`  
**Current headers present:** X-Content-Type-Options ✅, X-Frame-Options ✅, Referrer-Policy ✅  
**Missing:**

| Header | Risk without it |
|--------|----------------|
| `Strict-Transport-Security` | Browser may fall back to HTTP; session hijacking |
| `Content-Security-Policy` | XSS attacks can load malicious scripts |
| `Permissions-Policy` | Browser APIs (camera, mic, geolocation) open to abuse |

**Fix:** Additive headers addition to `next.config.ts` — zero breakage risk.

---

## 🟡 MEDIUM ISSUES

---

### M1 — Appointment Route: IDOR — Any UUID Fetches Any Appointment
**File:** `app/api/appointment/[id]/route.ts`  
**Risk:** Any person with a UUID can read another business's appointment details

```typescript
// GET — no auth check, no ownership check:
const { data, error } = await supabaseAdmin
  .from("appointments")
  .select("*, services(name,price), salon:salons(name,slug,owner_email)")
  .eq("id", id)
  .single();
```

The GET handler on `/api/appointment/[id]` uses service role (bypasses RLS) and
has no authentication check. Anyone who guesses a UUID gets full appointment
details including client name, phone, email, and salon owner email.

Note: UUIDs are hard to guess but not secret. If any UUID leaks (e.g. in a
booking confirmation email URL), related appointments become readable.

**Mitigation:** Add a short-lived signed token to the reschedule URL instead of
the raw appointment ID, OR add an ownership check.

---

### M2 — OTP Send Endpoint Has No Rate Limiting
**File:** `app/api/auth/send-pw-otp/route.ts`  
**Risk:** Resend API spam abuse / DoS via email flooding

The OTP send endpoint validates the user's JWT (good) but has no rate limit on
how many OTPs a single user can request. A compromised account or an authenticated
user can trigger unlimited emails via Resend, incurring cost and potentially
getting the domain flagged as spam.

**Fix:** In-memory limit: max 3 OTP sends per user per 10 minutes.

---

### M3 — npm Audit: 1 High + 7 Moderate Vulnerabilities
**Command:** `npm audit`  
**Result:**

| Package | Severity | Issue |
|---------|----------|-------|
| `ws` (via Supabase) | **HIGH** | Uninitialized memory disclosure (GHSA-58qx-3vcg-4xpx) |
| `svix` (via Resend) | Moderate | Depends on vulnerable `uuid` |
| `resend` | Moderate | Depends on vulnerable `svix` |

**Fix:** `npm audit fix` resolves the moderate ones. `ws` requires checking if
`@supabase/supabase-js` update is available.

---

### M4 — Error Responses Leak Internal Details
**File:** `app/api/auth/send-pw-otp/route.ts` line 106  
```typescript
return NextResponse.json({ error: `Server error: ${String(err)}` }, { status: 500 });
```

Stack traces and internal error messages visible in API responses. An attacker
can probe endpoints to learn internal structure.

**Fix:** Return generic `"Internal server error"` to client, log details server-side only.

---

## ⚪ LOW ISSUES

---

### L1 — dangerouslySetInnerHTML in Blog Pages
**Files:** Multiple `app/blog/*/page.tsx`  
All uses are for JSON-LD structured data using `JSON.stringify()` on static
server-defined objects — no user input involved. **Not an active XSS risk.**
Flagged for awareness only.

---

### L2 — Image Remote Patterns Too Broad
**File:** `next.config.ts`  
```typescript
{ protocol: "https", hostname: "**" } // allows ANY https image
```
Not a direct security hole, but allows your Next.js image optimization endpoint
to proxy any HTTPS URL — potential for Server-Side Request Forgery (SSRF) against
internal Vercel infrastructure. Consider restricting to known domains.

---

### L3 — Stripe Webhook Deduplication Missing
**File:** `app/api/stripe-webhook/route.ts`  
Stripe may retry failed webhook events. If the same `payment_intent.succeeded`
event is processed twice, you could insert duplicate payment records. Add
idempotency check: skip if `stripe_payment_intent_id` already exists in `payments` table.

---

## ✅ WHAT IS CORRECT

- No hardcoded API keys in source code ✅
- `.env*` properly in `.gitignore` ✅
- `SUPABASE_SERVICE_ROLE_KEY` only in server-side API routes — never in client code ✅
- `NEXT_PUBLIC_` prefix only on truly public values (anon key, Stripe publishable key) ✅
- Stripe webhook DOES verify signature when secret is set ✅
- Admin 2FA (TOTP) implemented ✅
- Admin role check from database (not just JWT claim) ✅
- `poweredByHeader: false` set ✅
- X-Frame-Options: DENY set ✅
- OTP uses 10-minute time window (reasonable) ✅

---

## PRIORITISED FIX ORDER

| # | Issue | File | Effort | Impact |
|---|-------|------|--------|--------|
| 1 | **C1** — Stripe webhook unsigned fallback | `stripe-webhook/route.ts` | 5 min | Critical |
| 2 | **C2** — Client-supplied payment amount | `create-payment-intent/route.ts` | 30 min | Critical |
| 3 | **C3** — OTP fallback-secret | `send-pw-otp` + `verify-pw-otp` | 10 min | Critical |
| 4 | **H1** — Add middleware.ts | new file | 20 min | High |
| 5 | **H2** — Admin brute force | `admin/auth/route.ts` | 15 min | High |
| 6 | **H3** — Security headers | `next.config.ts` | 10 min | High |
| 7 | **M1** — Appointment IDOR | `appointment/[id]/route.ts` | 20 min | Medium |
| 8 | **M2** — OTP rate limit | `send-pw-otp/route.ts` | 10 min | Medium |
| 9 | **M3** — npm audit fix | terminal | 5 min | Medium |
| 10 | **M4** — Error leakage | multiple routes | 15 min | Medium |
| 11 | **L3** — Webhook deduplication | `stripe-webhook/route.ts` | 15 min | Low |

---

**AUDIT COMPLETE — Awaiting your approval before making any fixes.**  
Recommend starting with C1 (Stripe webhook) + C3 (OTP secret) as they are
5–10 minute fixes with highest impact.
