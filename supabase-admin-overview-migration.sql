-- ═══════════════════════════════════════════════════════════════
-- Admin Overview Dashboard — Migration
-- Adds business_type to salons (no formal migration existed for it)
-- All subscription columns already exist from supabase-subscription-migration.sql
-- Safe to run multiple times (IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS business_type TEXT;

-- ─── Verify all admin-overview columns exist ──────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'salons'
  AND column_name IN (
    'business_type',
    'subscription_status',
    'subscription_plan',
    'subscription_id',
    'stripe_customer_id',
    'trial_ends_at',
    'current_period_end'
  )
ORDER BY column_name;
