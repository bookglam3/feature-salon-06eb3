-- ═══════════════════════════════════════════════════════════════════
-- SUPER ADMIN — Employee / Sales Agent Applications System
-- Run in: Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (all statements are idempotent)
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. Ensure all required columns exist on sales_agents
--    (base table created by supabase-partner-system.sql)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE sales_agents
  ADD COLUMN IF NOT EXISTS admin_notes      TEXT,
  ADD COLUMN IF NOT EXISTS referral_code    TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by      TEXT,
  ADD COLUMN IF NOT EXISTS street_address   TEXT,
  ADD COLUMN IF NOT EXISTS postcode         TEXT,
  ADD COLUMN IF NOT EXISTS country          TEXT DEFAULT 'GB',
  ADD COLUMN IF NOT EXISTS id_card_number   TEXT,
  ADD COLUMN IF NOT EXISTS id_issue_date    DATE,
  ADD COLUMN IF NOT EXISTS id_expiry_date   DATE,
  ADD COLUMN IF NOT EXISTS id_card_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS selfie_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS referred_salons  INT  DEFAULT 0;

-- Unique constraint on referral_code (safe — skips if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sales_agents_referral_code_key'
  ) THEN
    ALTER TABLE sales_agents ADD CONSTRAINT sales_agents_referral_code_key UNIQUE (referral_code);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 2. Convenience VIEW: employee_applications → sales_agents
--    Lets future queries use either name interchangeably
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW employee_applications AS
  SELECT
    id,
    full_name,
    phone,
    whatsapp,
    city,
    postcode,
    country,
    street_address,
    experience,
    own_vehicle      AS vehicle,
    daily_availability AS availability,
    why_hire,
    id_card_number,
    id_issue_date,
    id_expiry_date,
    id_card_photo_url,
    selfie_photo_url,
    status,
    admin_notes,
    referral_code,
    referred_salons,
    reviewed_at,
    reviewed_by,
    created_at
  FROM sales_agents;

-- ─────────────────────────────────────────────────────────────────
-- 3. RLS — ensure enabled and policies exist
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE sales_agents ENABLE ROW LEVEL SECURITY;

-- Public application form: anyone can insert
DROP POLICY IF EXISTS "agents_public_insert" ON sales_agents;
CREATE POLICY "agents_public_insert"
  ON sales_agents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admin reads via service role key (bypasses RLS) — no SELECT policy needed for anon
-- This prevents public from reading other applicants' data

-- ─────────────────────────────────────────────────────────────────
-- 4. Track referred salons — auto-increment counter via trigger
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_referred_salons()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- When a new salon signs up with a referral code, increment agent's counter
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE sales_agents
    SET referred_salons = referred_salons + 1
    WHERE referral_code = NEW.referred_by;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_referral_count ON salons;
CREATE TRIGGER trg_salon_referral_count
  AFTER INSERT ON salons
  FOR EACH ROW
  EXECUTE FUNCTION increment_referred_salons();

-- ─────────────────────────────────────────────────────────────────
-- 5. Indexes for fast admin queries
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sales_agents_status        ON sales_agents (status);
CREATE INDEX IF NOT EXISTS idx_sales_agents_created_at    ON sales_agents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_agents_referral_code ON sales_agents (referral_code);
CREATE INDEX IF NOT EXISTS idx_salons_referred_by         ON salons (referred_by);

-- ─────────────────────────────────────────────────────────────────
-- 6. Verify schema
-- ─────────────────────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sales_agents'
ORDER BY ordinal_position;
