-- ═══════════════════════════════════════════════════════════════
-- SUBSCRIPTION SYSTEM MIGRATION
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS stripe_customer_id   TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status  TEXT    DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_plan    TEXT    DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS subscription_id      TEXT,
  ADD COLUMN IF NOT EXISTS trial_ends_at        TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  ADD COLUMN IF NOT EXISTS current_period_end   TIMESTAMPTZ;

-- Set trial_ends_at for existing salons that don't have it yet
UPDATE salons
SET trial_ends_at = created_at + INTERVAL '14 days'
WHERE trial_ends_at IS NULL AND created_at IS NOT NULL;

-- Verify
SELECT id, name, subscription_status, subscription_plan, trial_ends_at
FROM salons
ORDER BY created_at DESC
LIMIT 10;
