-- ============================================================
-- FEATURE SALON — NEW FEATURES MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_name     TEXT NOT NULL,
  client_email    TEXT,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT NOT NULL,
  reply           TEXT,
  is_published    BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owner manages reviews"
  ON reviews FOR ALL
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Published reviews readable by all"
  ON reviews FOR SELECT
  USING (is_published = true);

-- 2. DISCOUNT CODES TABLE
CREATE TABLE IF NOT EXISTS discount_codes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id    UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value       NUMERIC(10,2) NOT NULL,
  max_uses    INTEGER,
  uses        INTEGER DEFAULT 0,
  expires_at  TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id, code)
);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owner manages discount_codes"
  ON discount_codes FOR ALL
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Public read for booking page validation
CREATE POLICY "Public read active codes"
  ON discount_codes FOR SELECT
  USING (is_active = true);

-- 3. GIFT CARDS TABLE
CREATE TABLE IF NOT EXISTS gift_cards (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  code            TEXT NOT NULL UNIQUE,
  amount          NUMERIC(10,2) NOT NULL,
  remaining       NUMERIC(10,2) NOT NULL,
  recipient_name  TEXT NOT NULL,
  recipient_email TEXT,
  is_redeemed     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owner manages gift_cards"
  ON gift_cards FOR ALL
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Public can validate gift card codes
CREATE POLICY "Public read gift cards"
  ON gift_cards FOR SELECT
  USING (true);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_reviews_salon     ON reviews(salon_id);
CREATE INDEX IF NOT EXISTS idx_discount_salon    ON discount_codes(salon_id);
CREATE INDEX IF NOT EXISTS idx_discount_code     ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_gift_salon        ON gift_cards(salon_id);
CREATE INDEX IF NOT EXISTS idx_gift_code         ON gift_cards(code);

-- ============================================================
-- SAMPLE DATA (optional — remove if not needed)
-- ============================================================
-- INSERT INTO reviews (salon_id, client_name, rating, comment, is_published)
-- SELECT id, 'Jane Smith', 5, 'Amazing service! Will definitely come back.', true
-- FROM salons LIMIT 1;
