-- ═══════════════════════════════════════════════════════════════
-- Variable pricing display flag ("from £25")
-- ═══════════════════════════════════════════════════════════════
-- Run this once in the Supabase SQL editor.
-- Additive only: no backfill, no existing column touched. Every
-- existing service keeps working unchanged with price_is_from = false.

ALTER TABLE services ADD COLUMN IF NOT EXISTS price_is_from boolean NOT NULL DEFAULT false;
