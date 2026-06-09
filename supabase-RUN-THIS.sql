-- ═══════════════════════════════════════════════════════════════
-- FEATURE SALON — RUN THIS IN SUPABASE SQL EDITOR
-- Covers all pending migrations (beauty consultation + admin overview)
-- Safe to run multiple times (IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════

-- 1. appointments.notes  (beauty consultation + physio/dental treatment notes)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. salons.business_type  (hair / beauty / barber / spa etc.)
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS business_type TEXT;

-- ─── Verify ───────────────────────────────────────────────────
SELECT 'appointments' AS tbl, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'appointments' AND column_name = 'notes'
UNION ALL
SELECT 'salons' AS tbl, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'salons'
  AND column_name IN (
    'business_type', 'subscription_status', 'subscription_plan',
    'stripe_customer_id', 'trial_ends_at', 'current_period_end'
  )
ORDER BY tbl, column_name;
