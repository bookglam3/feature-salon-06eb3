-- ═══════════════════════════════════════════════════════════════════
-- PARTNER / SALES AGENT SYSTEM — Migration
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. sales_agents table
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_agents (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       TIMESTAMPTZ DEFAULT NOW(),

  -- Application fields
  full_name        TEXT        NOT NULL,
  phone            TEXT        NOT NULL,
  whatsapp         TEXT,
  city             TEXT        NOT NULL,
  experience       TEXT        NOT NULL,   -- e.g. "2 years", "fresher"
  own_vehicle      BOOLEAN     DEFAULT FALSE,
  daily_availability TEXT      NOT NULL,   -- e.g. "full-time", "part-time", "evenings"
  why_hire         TEXT        NOT NULL,

  -- Admin fields
  status           TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected')),
  admin_notes      TEXT,
  reviewed_at      TIMESTAMPTZ,
  reviewed_by      TEXT,

  -- Referral system
  referral_code    TEXT        UNIQUE,     -- generated on approval, e.g. "AGT-ABC123"
  referred_salons  INT         DEFAULT 0   -- count of salons that signed up via this agent
);

-- ─────────────────────────────────────────────────────────────────
-- 2. Track which salon came from which agent
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS referred_by TEXT;   -- stores referral_code of the agent

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_salons_referred_by ON salons (referred_by);

-- ─────────────────────────────────────────────────────────────────
-- 3. Indexes
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sales_agents_status       ON sales_agents (status);
CREATE INDEX IF NOT EXISTS idx_sales_agents_created_at   ON sales_agents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_agents_referral_code ON sales_agents (referral_code);

-- ─────────────────────────────────────────────────────────────────
-- 4. RLS Policies
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE sales_agents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe / idempotent)
DROP POLICY IF EXISTS "agents_public_insert"  ON sales_agents;
DROP POLICY IF EXISTS "agents_admin_all"      ON sales_agents;
DROP POLICY IF EXISTS "agents_public_select"  ON sales_agents;

-- Anyone can submit an application (public form)
CREATE POLICY "agents_public_insert"
  ON sales_agents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public can read their own application via referral_code (for agent portal later)
-- For now, allow admins (service role) to read all
-- Anon can INSERT only — no SELECT for public (admin dashboard uses service role)

-- ─────────────────────────────────────────────────────────────────
-- 5. Verify
-- ─────────────────────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales_agents'
ORDER BY ordinal_position;

SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'sales_agents';
