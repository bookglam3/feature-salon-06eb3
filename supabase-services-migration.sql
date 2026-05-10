-- ═══════════════════════════════════════════════════════════════
-- SERVICES TABLE MIGRATION
-- Run this in Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (uses IF NOT EXISTS / DO blocks)
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. Add description column to services
-- ─────────────────────────────────────────────────────────────
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS description TEXT;

-- ─────────────────────────────────────────────────────────────
-- 2. Ensure RLS is enabled on services
-- ─────────────────────────────────────────────────────────────
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 3. DROP old policies (safe — ignore errors if they don't exist)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner can manage their services"  ON services;
DROP POLICY IF EXISTS "Public can view services"         ON services;
DROP POLICY IF EXISTS "services_select"                  ON services;
DROP POLICY IF EXISTS "services_insert"                  ON services;
DROP POLICY IF EXISTS "services_update"                  ON services;
DROP POLICY IF EXISTS "services_delete"                  ON services;

-- ─────────────────────────────────────────────────────────────
-- 4. Public can READ services (for booking page — no auth needed)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "services_select"
  ON services FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- 5. Owner can INSERT services for their own salon
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "services_insert"
  ON services FOR INSERT
  WITH CHECK (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 6. Owner can UPDATE their own salon's services
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "services_update"
  ON services FOR UPDATE
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 7. Owner can DELETE their own salon's services
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "services_delete"
  ON services FOR DELETE
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 8. Verify — should show your services
-- ─────────────────────────────────────────────────────────────
SELECT id, name, price, duration_minutes, description
FROM services
LIMIT 10;
