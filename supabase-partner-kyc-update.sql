-- ═══════════════════════════════════════════════════════════════════
-- PARTNER SYSTEM — Identity Verification Update
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. Add identity + address fields to sales_agents
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE sales_agents
  ADD COLUMN IF NOT EXISTS id_card_number    TEXT,
  ADD COLUMN IF NOT EXISTS id_issue_date     DATE,
  ADD COLUMN IF NOT EXISTS id_expiry_date    DATE,
  ADD COLUMN IF NOT EXISTS id_card_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS selfie_photo_url  TEXT,
  ADD COLUMN IF NOT EXISTS street_address    TEXT,
  ADD COLUMN IF NOT EXISTS postcode          TEXT,
  ADD COLUMN IF NOT EXISTS country           TEXT DEFAULT 'GB';

-- ─────────────────────────────────────────────────────────────────
-- 2. Create partner-documents storage bucket
-- ─────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-documents',
  'partner-documents',
  false,
  5242880,  -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 3. Storage RLS — allow public upload, admin read
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "partner_docs_upload" ON storage.objects;
DROP POLICY IF EXISTS "partner_docs_admin_read" ON storage.objects;

-- Anyone can upload (during application submission)
CREATE POLICY "partner_docs_upload"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'partner-documents');

-- Only authenticated users (admins via service role) can read
CREATE POLICY "partner_docs_admin_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'partner-documents');

-- ─────────────────────────────────────────────────────────────────
-- 4. Verify
-- ─────────────────────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sales_agents'
ORDER BY ordinal_position;
