-- ═══════════════════════════════════════════════════════════════
-- REMINDER SYSTEM MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → Run)
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. Appointment reminder tracking columns
-- ─────────────────────────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_2h_sent  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS thankyou_1h_sent  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS winback_sent      BOOLEAN DEFAULT FALSE;

-- ─────────────────────────────────────────
-- 2. Client SMS opt-out support
-- ─────────────────────────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS sms_opt_out BOOLEAN DEFAULT FALSE;

-- ─────────────────────────────────────────
-- 3. Per-salon reminder settings
-- ─────────────────────────────────────────
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS review_link       TEXT;

-- ─────────────────────────────────────────
-- 4. Indexes for cron query performance
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_appts_reminder_24h
  ON appointments (date_time, reminder_24h_sent, status);

CREATE INDEX IF NOT EXISTS idx_appts_reminder_2h
  ON appointments (date_time, reminder_2h_sent, status);

CREATE INDEX IF NOT EXISTS idx_appts_thankyou_1h
  ON appointments (date_time, thankyou_1h_sent, status);

CREATE INDEX IF NOT EXISTS idx_appts_winback
  ON appointments (date_time, winback_sent, status);

-- ─────────────────────────────────────────
-- 5. pg_cron schedule — every 30 minutes
-- Requires: pg_cron extension enabled in Supabase (Database → Extensions → pg_cron)
-- Also requires: pg_net extension enabled (Database → Extensions → pg_net)
-- ─────────────────────────────────────────

-- Remove old schedule if it exists
SELECT cron.unschedule('send-reminders-every-30min')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-reminders-every-30min'
);

-- Create new schedule
SELECT cron.schedule(
  'send-reminders-every-30min',
  '*/30 * * * *',
  $$
    SELECT net.http_get(
      url := current_setting('app.cron_url', true)
    ) AS request_id;
  $$
);

-- Set the cron URL (update to your production URL):
ALTER DATABASE postgres
  SET app.cron_url = 'https://feature-saas.vercel.app/api/send-reminder?secret=salon123';

-- ─────────────────────────────────────────
-- 6. GDPR opt-out handler table
--    Clients who reply STOP via Twilio webhook
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sms_opt_outs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone      TEXT NOT NULL UNIQUE,   -- normalised E.164 e.g. +447911123456
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_phone ON sms_opt_outs (phone);

-- RLS: service role only (Twilio webhook uses service key)
ALTER TABLE sms_opt_outs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON sms_opt_outs
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- Verify columns added
-- ─────────────────────────────────────────
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('appointments', 'salons')
  AND column_name IN (
    'reminder_24h_sent', 'reminder_2h_sent',
    'thankyou_1h_sent', 'winback_sent',
    'sms_opt_out', 'reminders_enabled', 'review_link'
  )
ORDER BY table_name, column_name;
