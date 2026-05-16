-- ═══════════════════════════════════════════════════════════════
-- FINAL FEATURES MIGRATION: Reviews + Automations
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → Run)
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. REVIEWS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id     UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_name  TEXT NOT NULL,
  client_email TEXT,
  rating       INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT NOT NULL,
  reply        TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_salon ON reviews (salon_id, created_at DESC);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Salon owners can manage all reviews for their salon
CREATE POLICY "Salon owner review access" ON reviews
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- Published reviews are publicly readable (for booking page display)
CREATE POLICY "Public read published reviews" ON reviews
  FOR SELECT USING (is_published = TRUE);

-- ─────────────────────────────────────────────────────────────
-- 2. AUTOMATIONS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id    UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('birthday','winback','anniversary','referral')),
  is_active   BOOLEAN DEFAULT FALSE,
  channel     TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp','sms','email')),
  message     TEXT NOT NULL DEFAULT '',
  days_before INT  DEFAULT 0,
  reward      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (salon_id, type)
);

CREATE INDEX IF NOT EXISTS idx_automations_salon ON automations (salon_id);
CREATE INDEX IF NOT EXISTS idx_automations_active ON automations (is_active) WHERE is_active = TRUE;

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Salon owner automation access" ON automations
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- Verify all tables
-- ─────────────────────────────────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'waitlist','discount_codes','gift_cards',
    'loyalty_points','loyalty_transactions',
    'broadcast_messages','reviews','automations'
  )
ORDER BY table_name;
