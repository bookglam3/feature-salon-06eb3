-- ═══════════════════════════════════════════════════════════════
-- LOGO FIX MIGRATION — Run this in Supabase SQL Editor
-- Adds logo_url and description columns to salons table
-- ═══════════════════════════════════════════════════════════════

-- Add missing columns to salons table
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS logo_url     TEXT,
  ADD COLUMN IF NOT EXISTS description  TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT FALSE;

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'salons'
  AND column_name IN ('logo_url', 'description', 'whatsapp_enabled')
ORDER BY column_name;
