-- ═══════════════════════════════════════════════════════════════
-- Beauty Consultation Form — Migration
-- Adds `notes` column to appointments (used for treatment notes
-- in physio/dental, and beauty consultation JSON for beauty type)
-- Safe to run multiple times (IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ─── Verify ───────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'appointments'
  AND column_name = 'notes';
