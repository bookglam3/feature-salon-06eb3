-- ═══════════════════════════════════════════════════════════════
-- FEATURE SALON — ALL NEW FEATURES MIGRATION
-- Run ONE TIME in: Supabase Dashboard → SQL Editor → Paste → Run
-- Safe to run multiple times (uses IF NOT EXISTS everywhere)
-- ═══════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- 1. STRIPE CONNECT — salons table additions
-- ─────────────────────────────────────────────────────────────
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS stripe_account_id      TEXT,
  ADD COLUMN IF NOT EXISTS payouts_enabled         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS charges_enabled         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS connect_onboarded_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS country                 TEXT;

CREATE INDEX IF NOT EXISTS idx_salons_stripe_account
  ON salons (stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────
-- 2. NO-SHOW ALERT — appointments table addition
-- ─────────────────────────────────────────────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS no_show_alert_sent      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_confirmation_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_24h_sent       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_2h_sent        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_winback_sent   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_thankyou_sent  BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_appts_noshow
  ON appointments (date_time, no_show_alert_sent, status);


-- ─────────────────────────────────────────────────────────────
-- 3. BROADCAST MESSAGES — email/sms/whatsapp campaigns
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id        UUID REFERENCES salons(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  channel         TEXT NOT NULL DEFAULT 'email', -- 'email' | 'sms' | 'whatsapp'
  recipient_count INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'sending',         -- 'sending' | 'sent' | 'partial' | 'failed'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_salon_id
  ON broadcast_messages (salon_id, created_at DESC);

ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on broadcast_messages" ON broadcast_messages;
CREATE POLICY "Allow all on broadcast_messages" ON broadcast_messages
  FOR ALL USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- 4. LOYALTY POINTS — client reward system
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_points (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id        UUID REFERENCES salons(id) ON DELETE CASCADE,
  client_email    TEXT NOT NULL,
  client_name     TEXT NOT NULL DEFAULT '',
  points          INTEGER DEFAULT 0,
  total_earned    INTEGER DEFAULT 0,
  total_redeemed  INTEGER DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id, client_email)
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id        UUID REFERENCES salons(id) ON DELETE CASCADE,
  client_email    TEXT NOT NULL,
  points          INTEGER NOT NULL,
  type            TEXT NOT NULL,  -- 'earn' | 'redeem' | 'bonus'
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_salon_client
  ON loyalty_points (salon_id, client_email);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_salon
  ON loyalty_transactions (salon_id, created_at DESC);

ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on loyalty_points" ON loyalty_points;
CREATE POLICY "Allow all on loyalty_points" ON loyalty_points
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on loyalty_transactions" ON loyalty_transactions;
CREATE POLICY "Allow all on loyalty_transactions" ON loyalty_transactions
  FOR ALL USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- 5. WAITLIST — clients waiting for appointment slots
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waitlist (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id        UUID REFERENCES salons(id) ON DELETE CASCADE,
  client_name     TEXT NOT NULL,
  client_email    TEXT DEFAULT '',
  client_phone    TEXT DEFAULT '',
  preferred_date  DATE,
  preferred_time  TEXT DEFAULT '',
  notes           TEXT DEFAULT '',
  status          TEXT DEFAULT 'waiting',  -- 'waiting' | 'contacted' | 'booked' | 'removed'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_salon_id
  ON waitlist (salon_id, created_at ASC);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on waitlist" ON waitlist;
CREATE POLICY "Allow all on waitlist" ON waitlist
  FOR ALL USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- 6. FIX: owner_email — fill from auth.users for old salons
-- ─────────────────────────────────────────────────────────────
UPDATE salons s
SET owner_email = u.email
FROM auth.users u
WHERE s.owner_id = u.id
  AND (s.owner_email IS NULL OR s.owner_email = '');


-- ─────────────────────────────────────────────────────────────
-- 7. FIX: confirmed appointments stuck in 'pending'
-- ─────────────────────────────────────────────────────────────
UPDATE appointments
SET status = 'confirmed'
WHERE payment_status IN ('paid', 'deposit_paid', 'pay_at_salon')
  AND status = 'pending';


-- ─────────────────────────────────────────────────────────────
-- 8. PostgREST reload
-- ─────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';


-- ─────────────────────────────────────────────────────────────
-- 6. DISCOUNT CODES — promo codes for bookings
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discount_codes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id    UUID REFERENCES salons(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' | 'fixed'
  value       NUMERIC(10,2) NOT NULL,
  max_uses    INTEGER,
  uses        INTEGER DEFAULT 0,
  expires_at  TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id, code)
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_salon
  ON discount_codes (salon_id, is_active);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on discount_codes" ON discount_codes;
CREATE POLICY "Allow all on discount_codes" ON discount_codes
  FOR ALL USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- 7. GIFT CARDS — digital gift cards
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gift_cards (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id         UUID REFERENCES salons(id) ON DELETE CASCADE,
  code             TEXT NOT NULL UNIQUE,
  amount           NUMERIC(10,2) NOT NULL,
  remaining        NUMERIC(10,2) NOT NULL,
  recipient_name   TEXT NOT NULL DEFAULT '',
  recipient_email  TEXT DEFAULT '',
  is_redeemed      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_salon
  ON gift_cards (salon_id, created_at DESC);

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on gift_cards" ON gift_cards;
CREATE POLICY "Allow all on gift_cards" ON gift_cards
  FOR ALL USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- VERIFY — check all tables exist
-- ─────────────────────────────────────────────────────────────
SELECT table_name,
  '✅ OK' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'salons','appointments','payments','sms_opt_outs',
    'broadcast_messages','loyalty_points','loyalty_transactions',
    'waitlist','discount_codes','gift_cards'
  )
ORDER BY table_name;
