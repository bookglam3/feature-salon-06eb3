-- ═══════════════════════════════════════════════════════════════
-- PAYMENT METHODS MIGRATION
-- Run in Supabase SQL Editor after supabase-reminders-migration.sql
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. Add payment_methods JSONB column to salons
--    Default: all methods enabled, custom deposit 50%
-- ─────────────────────────────────────────
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '{
    "full_online": true,
    "deposit_online": true,
    "pay_at_salon": false,
    "custom_deposit": false,
    "deposit_percent": 50
  }'::jsonb;

-- ─────────────────────────────────────────
-- 2. Add address column if not already present
--    (used in booking confirmation emails)
-- ─────────────────────────────────────────
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS address TEXT;

-- ─────────────────────────────────────────
-- 3. Add owner_email column if not already present
--    (used in booking confirmation emails)
-- ─────────────────────────────────────────
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- ─────────────────────────────────────────
-- 4. Update existing salons with default payment_methods
-- ─────────────────────────────────────────
UPDATE salons
SET payment_methods = '{
  "full_online": true,
  "deposit_online": true,
  "pay_at_salon": false,
  "custom_deposit": false,
  "deposit_percent": 50
}'::jsonb
WHERE payment_methods IS NULL;

-- ─────────────────────────────────────────
-- 5. Add payment_method column to appointments
--    Records which method the client chose
-- ─────────────────────────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pending';
  -- Values: 'full_online' | 'deposit_online' | 'custom_deposit' | 'pay_at_salon'

-- ─────────────────────────────────────────
-- Verify
-- ─────────────────────────────────────────
SELECT id, name, payment_methods
FROM salons
LIMIT 5;
