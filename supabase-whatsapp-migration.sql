-- ═══════════════════════════════════════════════════════════════
-- WHATSAPP REMINDERS MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → Run)
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. Appointment WhatsApp tracking columns
-- ─────────────────────────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS whatsapp_confirmation_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_24h_sent          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_2h_sent           BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_winback_sent      BOOLEAN DEFAULT FALSE;

-- ─────────────────────────────────────────
-- 2. Client-level WhatsApp opt-out
--    (stored on clients table — per client, not per appointment)
-- ─────────────────────────────────────────
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT FALSE;

-- ─────────────────────────────────────────
-- 3. Per-salon WhatsApp toggle
-- ─────────────────────────────────────────
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT FALSE;

-- ─────────────────────────────────────────
-- 4. Indexes for cron query performance
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_appts_wa_24h
  ON appointments (date_time, whatsapp_24h_sent, status);

CREATE INDEX IF NOT EXISTS idx_appts_wa_2h
  ON appointments (date_time, whatsapp_2h_sent, status);

CREATE INDEX IF NOT EXISTS idx_appts_wa_winback
  ON appointments (date_time, whatsapp_winback_sent, status);

-- ─────────────────────────────────────────
-- 5. Shared opt-out table already exists from reminders migration.
--    WhatsApp STOP replies use the same sms_opt_outs table
--    (one phone → opted out of both SMS and WhatsApp).
--    No action needed here.
-- ─────────────────────────────────────────

-- ─────────────────────────────────────────
-- Verify columns added
-- ─────────────────────────────────────────
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('appointments', 'salons', 'clients')
  AND column_name IN (
    'whatsapp_confirmation_sent',
    'whatsapp_24h_sent',
    'whatsapp_2h_sent',
    'whatsapp_winback_sent',
    'whatsapp_opt_out',
    'whatsapp_enabled'
  )
ORDER BY table_name, column_name;
