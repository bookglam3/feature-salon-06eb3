-- ═══════════════════════════════════════════════════════════════
-- REVIEWS FEATURE MIGRATION
-- Safe to re-run — all statements use IF NOT EXISTS / DROP IF EXISTS
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. Add review_token to appointments
--    Auto-generated UUID per appointment.
--    Used as a one-time review link token — only returned to the
--    client at booking confirmation time. Never exposed via owner
--    queries or any dashboard/public read endpoint.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS review_token UUID DEFAULT gen_random_uuid();

-- Back-fill any existing appointments that don't have a token yet
UPDATE appointments
  SET review_token = gen_random_uuid()
  WHERE review_token IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. Reviews table
--    CREATE IF NOT EXISTS handles the case where the table was
--    already created by the earlier automations migration.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id       UUID        NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  appointment_id UUID        REFERENCES appointments(id) ON DELETE SET NULL,
  client_name    TEXT        NOT NULL,
  rating         INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,                          -- optional, max 500 chars enforced in app
  is_published   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe alters for table that existed before (automations migration had no appointment_id)
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL;

-- Make comment optional if it was previously NOT NULL
DO $$
BEGIN
  ALTER TABLE reviews ALTER COLUMN comment DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- One review per appointment (idempotent)
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_appointment_id_key;
ALTER TABLE reviews
  ADD CONSTRAINT reviews_appointment_id_key UNIQUE (appointment_id);

-- Index for fast per-salon queries
CREATE INDEX IF NOT EXISTS idx_reviews_salon ON reviews (salon_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 3. Row Level Security
-- ─────────────────────────────────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop old policies from the automations migration (safe if absent)
DROP POLICY IF EXISTS "Salon owner review access"    ON reviews;
DROP POLICY IF EXISTS "Public read published reviews" ON reviews;
DROP POLICY IF EXISTS "owner_all_reviews"             ON reviews;
DROP POLICY IF EXISTS "public_published_reviews"      ON reviews;

-- Salon owner: read + update all reviews for their own salon
-- (INSERT is handled server-side via service_role — no client INSERT policy needed)
CREATE POLICY "owner_all_reviews" ON reviews
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- Public / anon: SELECT published reviews only
-- The app layer additionally filters by salon_id — this policy just enforces is_published
CREATE POLICY "public_published_reviews" ON reviews
  FOR SELECT USING (is_published = TRUE);

-- ─────────────────────────────────────────────────────────────
-- 4. Verify (output should show 1 for each)
-- ─────────────────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'review_token') AS appointments_has_review_token,
  (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews')           AS reviews_table_exists;
