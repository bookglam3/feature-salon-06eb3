-- ═══════════════════════════════════════════════════════════════
-- NO-SHOW ALERT MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → Run)
-- ═══════════════════════════════════════════════════════════════

-- Add no_show_alert_sent tracking column
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS no_show_alert_sent BOOLEAN DEFAULT FALSE;

-- Index for cron query performance
CREATE INDEX IF NOT EXISTS idx_appts_noshow
  ON appointments (date_time, no_show_alert_sent, status);

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
  AND column_name = 'no_show_alert_sent';
