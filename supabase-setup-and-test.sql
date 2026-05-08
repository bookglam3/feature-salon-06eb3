-- ═══════════════════════════════════════════════════════════════════
-- COMPLETE REMINDER SYSTEM SETUP + TEST
-- Run this ENTIRE file in Supabase Dashboard → SQL Editor → Run
-- 
-- This script:
--   1. Runs both migrations (reminders + WhatsApp columns)
--   2. Enables reminders for your salon
--   3. Creates a test appointment exactly 24h from now
--   4. Shows you the appointment ID so you can verify after API call
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- STEP 1: Run reminders migration (safe to re-run — IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminder_24h_sent  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_2h_sent   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS thankyou_1h_sent   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS winback_sent       BOOLEAN DEFAULT FALSE;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS sms_opt_out BOOLEAN DEFAULT FALSE;

ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS review_link       TEXT;

-- Opt-out table
CREATE TABLE IF NOT EXISTS sms_opt_outs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- STEP 2: Run WhatsApp migration
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS whatsapp_confirmation_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_24h_sent          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_2h_sent           BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_winback_sent      BOOLEAN DEFAULT FALSE;

ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT FALSE;

-- ─────────────────────────────────────────────────────────────────
-- STEP 3: Enable reminders + WhatsApp for your salon
-- ─────────────────────────────────────────────────────────────────
UPDATE salons
SET reminders_enabled = TRUE,
    whatsapp_enabled  = TRUE
WHERE id = (SELECT id FROM salons LIMIT 1);

-- ─────────────────────────────────────────────────────────────────
-- STEP 4: Create test appointment exactly 24h from NOW
--         (within the ±15-min cron window)
-- ─────────────────────────────────────────────────────────────────
WITH salon_data AS (
  SELECT id FROM salons LIMIT 1
),
service_data AS (
  SELECT id FROM services WHERE salon_id = (SELECT id FROM salon_data) LIMIT 1
)
INSERT INTO appointments (
  salon_id, service_id,
  client_name, client_email, client_phone,
  date_time, status, payment_status,
  reminder_24h_sent, reminder_2h_sent, thankyou_1h_sent, winback_sent,
  whatsapp_24h_sent
)
SELECT
  (SELECT id FROM salon_data),
  (SELECT id FROM service_data),
  'Test Reminder Client',
  'bookglam3@gmail.com',
  '+923464503668',
  NOW() + INTERVAL '24 hours',
  'confirmed',
  'paid',
  FALSE, FALSE, FALSE, FALSE, FALSE
RETURNING 
  id,
  client_name,
  client_email,
  client_phone,
  date_time,
  '✅ Appointment created — now call the API below' AS next_step,
  'https://feature-saas.vercel.app/api/send-reminder?secret=65361a5394edff6ecbce0e02c84b95c4a80a9a27adfef1a023bda8a2e914f354' AS api_url;

-- ─────────────────────────────────────────────────────────────────
-- STEP 5: After running — call this URL in your browser:
--   https://feature-saas.vercel.app/api/send-reminder?secret=65361a5394edff6ecbce0e02c84b95c4a80a9a27adfef1a023bda8a2e914f354
--
-- Expected response: {"success":true,"sent":1,...}
-- Then run this query to verify:
--   SELECT id, reminder_24h_sent, whatsapp_24h_sent FROM appointments
--   WHERE client_email = 'bookglam3@gmail.com'
--   ORDER BY created_at DESC LIMIT 1;
-- ─────────────────────────────────────────────────────────────────
