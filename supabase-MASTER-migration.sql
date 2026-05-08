-- ═══════════════════════════════════════════════════════════════
-- MASTER FIX MIGRATION — Run this in Supabase SQL Editor
-- This safely adds ALL required columns (IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════

-- ─── appointments table ───────────────────────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS payment_status     TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_intent_id  TEXT,
  ADD COLUMN IF NOT EXISTS payment_method     TEXT DEFAULT 'full_online',
  ADD COLUMN IF NOT EXISTS reminder_24h_sent  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_2h_sent   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS thankyou_1h_sent   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS winback_sent       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sms_opt_out        BOOLEAN DEFAULT FALSE;

-- ─── salons table ─────────────────────────────────────────────
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS reminders_enabled  BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS review_link        TEXT,
  ADD COLUMN IF NOT EXISTS payment_methods    JSONB DEFAULT '{
    "full_online": true,
    "deposit_online": true,
    "pay_at_salon": false,
    "custom_deposit": false,
    "deposit_percent": 50
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS address            TEXT,
  ADD COLUMN IF NOT EXISTS owner_email        TEXT;

-- ─── payments table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id            UUID REFERENCES appointments(id) ON DELETE SET NULL,
  stripe_payment_intent_id  TEXT NOT NULL,
  amount                    NUMERIC(10,2) NOT NULL,
  currency                  TEXT DEFAULT 'gbp',
  status                    TEXT NOT NULL,
  deposit_only              BOOLEAN DEFAULT FALSE,
  receipt_email             TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ─── sms_opt_outs table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS sms_opt_outs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id    ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_intent_id         ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appts_reminder_24h         ON appointments(date_time, reminder_24h_sent, status);
CREATE INDEX IF NOT EXISTS idx_appts_reminder_2h          ON appointments(date_time, reminder_2h_sent, status);
CREATE INDEX IF NOT EXISTS idx_appts_thankyou_1h          ON appointments(date_time, thankyou_1h_sent, status);
CREATE INDEX IF NOT EXISTS idx_appts_winback              ON appointments(date_time, winback_sent, status);
CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_phone         ON sms_opt_outs(phone);

-- ─── RLS Policies ─────────────────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on payments" ON payments;
CREATE POLICY "Allow all on payments" ON payments
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE sms_opt_outs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON sms_opt_outs;
CREATE POLICY "Allow all on sms_opt_outs" ON sms_opt_outs
  FOR ALL USING (true) WITH CHECK (true);

-- ─── Appointments INSERT policy (public booking page needs this) ──
-- Check if appointments has RLS and if anon can insert
DO $$
BEGIN
  -- Allow anonymous inserts for booking page
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'appointments' AND policyname = 'Allow anon insert'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow anon insert" ON appointments FOR INSERT TO anon WITH CHECK (true)';
  END IF;

  -- Allow anonymous selects (for checking slot availability)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'appointments' AND policyname = 'Allow anon select'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow anon select" ON appointments FOR SELECT TO anon USING (true)';
  END IF;
END $$;

-- ─── Update existing salons with default payment_methods ──────
UPDATE salons
SET payment_methods = '{
  "full_online": true,
  "deposit_online": true,
  "pay_at_salon": false,
  "custom_deposit": false,
  "deposit_percent": 50
}'::jsonb
WHERE payment_methods IS NULL;

-- ─── Verify ───────────────────────────────────────────────────
SELECT
  'appointments' AS tbl,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'appointments'
  AND column_name IN ('payment_status','payment_intent_id','payment_method','reminder_24h_sent','reminder_2h_sent','thankyou_1h_sent','winback_sent')
UNION ALL
SELECT
  'salons' AS tbl,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'salons'
  AND column_name IN ('reminders_enabled','review_link','payment_methods','address','owner_email')
ORDER BY tbl, column_name;
