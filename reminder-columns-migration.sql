-- ══════════════════════════════════════════════════════════════
-- Reminder Columns Migration
-- Run this in Supabase SQL Editor to enable automated reminders
-- ══════════════════════════════════════════════════════════════

-- 1. Add reminder tracking columns to appointments table
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminder_24h_sent    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_2h_sent     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS thankyou_1h_sent     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS winback_sent         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_24h_sent    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_2h_sent     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_winback_sent BOOLEAN DEFAULT FALSE;

-- 2. Add WhatsApp and reminders flags to salons table
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS whatsapp_enabled   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminders_enabled  BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS review_link        TEXT;

-- 3. Create SMS opt-out table (GDPR compliance)
CREATE TABLE IF NOT EXISTS sms_opt_outs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create WhatsApp opt-out table (GDPR compliance)
CREATE TABLE IF NOT EXISTS whatsapp_opt_outs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Verify
SELECT 
  column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
  AND column_name IN (
    'reminder_24h_sent','reminder_2h_sent','thankyou_1h_sent',
    'winback_sent','whatsapp_24h_sent','whatsapp_2h_sent','whatsapp_winback_sent'
  )
ORDER BY column_name;
