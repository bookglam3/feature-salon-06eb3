-- ============================================================
-- FEATURE SALON — COMPLETE FIX SCRIPT
-- Run this in: Supabase Dashboard → SQL Editor → Paste → Run
-- ============================================================


-- ─────────────────────────────────────────────────────────
-- FIX 1: salons table میں missing columns add کریں
-- ─────────────────────────────────────────────────────────
ALTER TABLE salons ADD COLUMN IF NOT EXISTS phone       TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS city        TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS category    TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS country     TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS address     TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS logo_url    TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS review_link TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS reminders_enabled  BOOLEAN DEFAULT TRUE;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS whatsapp_enabled   BOOLEAN DEFAULT FALSE;


-- ─────────────────────────────────────────────────────────
-- FIX 2: owner_email خالی ہو تو auth.users سے fill کریں
-- (یہی وجہ ہے کہ صرف ایک salon کو confirmation email جاتی تھی)
-- ─────────────────────────────────────────────────────────
UPDATE salons s
SET owner_email = u.email
FROM auth.users u
WHERE s.owner_id = u.id
  AND (s.owner_email IS NULL OR s.owner_email = '');


-- ─────────────────────────────────────────────────────────
-- FIX 3: Stripe payment ہو چکی ہو لیکن status "pending" ہو
-- (یہی وجہ ہے کہ reminders نہیں جاتے تھے)
-- ─────────────────────────────────────────────────────────
UPDATE appointments
SET status = 'confirmed'
WHERE payment_status IN ('paid', 'deposit_paid', 'pay_at_salon')
  AND status = 'pending';


-- ─────────────────────────────────────────────────────────
-- FIX 4: appointments میں missing columns
-- ─────────────────────────────────────────────────────────
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_24h_sent        BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_2h_sent         BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS thankyou_1h_sent         BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS winback_sent             BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS whatsapp_confirmation_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS whatsapp_24h_sent        BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS whatsapp_2h_sent         BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS whatsapp_winback_sent    BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method           TEXT;


-- ─────────────────────────────────────────────────────────
-- VERIFY: سب کچھ ٹھیک ہے یہ check کریں
-- ─────────────────────────────────────────────────────────

-- Salons کی owner_email check کریں
SELECT name, owner_email,
  CASE WHEN owner_email IS NULL OR owner_email = '' 
    THEN '❌ EMAIL MISSING' 
    ELSE '✅ OK' 
  END AS status
FROM salons
ORDER BY name;


-- Appointments کا status check کریں
SELECT
  COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
  COUNT(*) FILTER (WHERE status = 'pending')   AS pending,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
  COUNT(*) AS total
FROM appointments;


-- ─────────────────────────────────────────────────────────
-- PostgREST reload (schema changes apply کریں)
-- ─────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
