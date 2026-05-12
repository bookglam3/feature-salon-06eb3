-- ═══════════════════════════════════════════════════════════════════
-- DOCUMENT VERIFICATION SYSTEM — Migration
-- Run in: Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (all idempotent)
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. Add verification fields to sales_agents
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE sales_agents
  ADD COLUMN IF NOT EXISTS verification_status  TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','rejected','flagged')),
  ADD COLUMN IF NOT EXISTS address_proof_url    TEXT,
  ADD COLUMN IF NOT EXISTS verification_notes   TEXT,
  ADD COLUMN IF NOT EXISTS verified_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by          TEXT,
  ADD COLUMN IF NOT EXISTS auto_flags           JSONB DEFAULT '[]'::jsonb;

-- ─────────────────────────────────────────────────────────────────
-- 2. Auto-flag function — runs on insert / update
--    Flags: missing selfie, missing ID photo, duplicate CNIC
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION compute_auto_flags()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  flags JSONB := '[]'::jsonb;
  dup_count INT;
BEGIN
  -- Flag: missing selfie
  IF NEW.selfie_photo_url IS NULL OR NEW.selfie_photo_url = '' THEN
    flags := flags || '["missing_selfie"]'::jsonb;
  END IF;

  -- Flag: missing ID photo
  IF NEW.id_card_photo_url IS NULL OR NEW.id_card_photo_url = '' THEN
    flags := flags || '["missing_id_photo"]'::jsonb;
  END IF;

  -- Flag: missing ID number
  IF NEW.id_card_number IS NULL OR NEW.id_card_number = '' THEN
    flags := flags || '["missing_id_number"]'::jsonb;
  END IF;

  -- Flag: duplicate CNIC
  IF NEW.id_card_number IS NOT NULL AND NEW.id_card_number != '' THEN
    SELECT COUNT(*) INTO dup_count
    FROM sales_agents
    WHERE id_card_number = NEW.id_card_number
      AND id != NEW.id;
    IF dup_count > 0 THEN
      flags := flags || '["duplicate_cnic"]'::jsonb;
    END IF;
  END IF;

  -- Auto-set verification_status to 'flagged' if any flags
  IF jsonb_array_length(flags) > 0 THEN
    NEW.auto_flags := flags;
    -- Only auto-flag if not already manually verified/rejected
    IF NEW.verification_status = 'pending' THEN
      NEW.verification_status := 'flagged';
    END IF;
  ELSE
    NEW.auto_flags := '[]'::jsonb;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_flags ON sales_agents;
CREATE TRIGGER trg_auto_flags
  BEFORE INSERT OR UPDATE ON sales_agents
  FOR EACH ROW
  EXECUTE FUNCTION compute_auto_flags();

-- ─────────────────────────────────────────────────────────────────
-- 3. Back-fill auto_flags for existing rows
-- ─────────────────────────────────────────────────────────────────
UPDATE sales_agents SET updated_at = NOW() WHERE 1=1;

-- If no updated_at column, use a safe touch:
-- This re-triggers the BEFORE UPDATE trigger to populate auto_flags
DO $$
BEGIN
  -- Compute flags for all existing rows manually since trigger is BEFORE INSERT/UPDATE
  UPDATE sales_agents
  SET auto_flags = (
    SELECT COALESCE(
      jsonb_agg(f ORDER BY f),
      '[]'::jsonb
    )
    FROM unnest(ARRAY[
      CASE WHEN selfie_photo_url IS NULL OR selfie_photo_url = '' THEN 'missing_selfie' END,
      CASE WHEN id_card_photo_url IS NULL OR id_card_photo_url = '' THEN 'missing_id_photo' END,
      CASE WHEN id_card_number IS NULL OR id_card_number = '' THEN 'missing_id_number' END
    ]) AS f(f)
    WHERE f IS NOT NULL
  )
  WHERE verification_status IS NULL OR verification_status = 'pending';
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore errors on backfill
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 4. Storage: partner-documents bucket (idempotent)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-documents', 'partner-documents', false,
  10485760,  -- 10MB max
  ARRAY['image/jpeg','image/png','image/webp','image/heic','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/heic','application/pdf'];

-- Storage policies
DROP POLICY IF EXISTS "partner_docs_upload"      ON storage.objects;
DROP POLICY IF EXISTS "partner_docs_admin_read"   ON storage.objects;
DROP POLICY IF EXISTS "partner_docs_public_read"  ON storage.objects;

-- Anyone can upload (during application form)
CREATE POLICY "partner_docs_upload"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'partner-documents');

-- Authenticated users can read (admin via service role; bucket is private)
CREATE POLICY "partner_docs_admin_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'partner-documents');

-- ─────────────────────────────────────────────────────────────────
-- 5. Indexes
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_agents_verification_status ON sales_agents (verification_status);
CREATE INDEX IF NOT EXISTS idx_agents_id_card_number      ON sales_agents (id_card_number);

-- ─────────────────────────────────────────────────────────────────
-- 6. Verify
-- ─────────────────────────────────────────────────────────────────
SELECT
  id, full_name, verification_status, auto_flags,
  id_card_number IS NOT NULL AS has_id,
  id_card_photo_url IS NOT NULL AS has_id_photo,
  selfie_photo_url IS NOT NULL AS has_selfie
FROM sales_agents
ORDER BY created_at DESC
LIMIT 10;
