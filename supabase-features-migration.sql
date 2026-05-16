-- ═══════════════════════════════════════════════════════════════
-- FEATURES MIGRATION: Waitlist + Gift Cards + Loyalty
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → Run)
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. WAITLIST TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waitlist (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id       UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_name    TEXT NOT NULL,
  client_email   TEXT,
  client_phone   TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  notes          TEXT,
  status         TEXT DEFAULT 'waiting'
                 CHECK (status IN ('waiting','contacted','booked','removed')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_salon ON waitlist (salon_id, created_at);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Salon owner waitlist access" ON waitlist
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- 2. DISCOUNT CODES TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discount_codes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id   UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('percentage','fixed')),
  value      NUMERIC(10,2) NOT NULL,
  max_uses   INT,
  uses       INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (salon_id, code)
);

CREATE INDEX IF NOT EXISTS idx_discount_salon ON discount_codes (salon_id);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Salon owner discount access" ON discount_codes
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- 3. GIFT CARDS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gift_cards (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id         UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  code             TEXT NOT NULL UNIQUE,
  amount           NUMERIC(10,2) NOT NULL,
  remaining        NUMERIC(10,2) NOT NULL,
  recipient_name   TEXT NOT NULL,
  recipient_email  TEXT,
  is_redeemed      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_salon ON gift_cards (salon_id);

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Salon owner gift card access" ON gift_cards
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- 4. LOYALTY POINTS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_points (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_email    TEXT NOT NULL,
  client_name     TEXT NOT NULL,
  points          INT DEFAULT 0,
  total_earned    INT DEFAULT 0,
  total_redeemed  INT DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (salon_id, client_email)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_salon ON loyalty_points (salon_id, points DESC);

ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Salon owner loyalty access" ON loyalty_points
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- 5. LOYALTY TRANSACTIONS LOG TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id     UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  points       INT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('earn','redeem','bonus','expire')),
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_salon ON loyalty_transactions (salon_id, created_at DESC);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Salon owner loyalty tx access" ON loyalty_transactions
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- Verify all tables created
-- ─────────────────────────────────────────────────────────────
SELECT table_name, (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) AS col_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('waitlist','discount_codes','gift_cards','loyalty_points','loyalty_transactions')
ORDER BY table_name;
