-- ═══════════════════════════════════════════════════════════════
-- STRIPE CONNECT EXPRESS MIGRATION
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → Run)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE salons ADD COLUMN IF NOT EXISTS stripe_account_id      TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS payouts_enabled         BOOLEAN DEFAULT FALSE;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS charges_enabled         BOOLEAN DEFAULT FALSE;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS connect_onboarded_at   TIMESTAMPTZ;

-- Index for webhook lookups by stripe_account_id
CREATE INDEX IF NOT EXISTS idx_salons_stripe_account
  ON salons (stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'salons'
  AND column_name IN ('stripe_account_id','payouts_enabled','charges_enabled','connect_onboarded_at')
ORDER BY column_name;
