-- ═══════════════════════════════════════════════════════════════════
-- STAFF + SERVICES RLS FIX
-- Run this in Supabase Dashboard → SQL Editor → Run
--
-- What this fixes:
--   1. Staff table RLS: allows authenticated owners to INSERT/UPDATE/DELETE their own staff
--   2. Staff table RLS: allows public SELECT (for booking page slot availability)
--   3. Services table RLS: verified/re-applied (idempotent)
--   4. Adds missing columns to staff table if not present
-- ═══════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────
-- 1. STAFF TABLE — ensure required columns exist
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS active       BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS services     TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS working_hours JSONB   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS role         TEXT    DEFAULT 'stylist';

-- Backfill nulls
UPDATE staff SET active = TRUE WHERE active IS NULL;
UPDATE staff SET services = '{}' WHERE services IS NULL;
UPDATE staff SET working_hours = '{}' WHERE working_hours IS NULL;


-- ─────────────────────────────────────────────────────────────────
-- 2. STAFF TABLE — RLS policies
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Drop all old policies first (safe / idempotent)
DROP POLICY IF EXISTS "Owner can manage their staff"    ON staff;
DROP POLICY IF EXISTS "Public can view staff"           ON staff;
DROP POLICY IF EXISTS "staff_select"                    ON staff;
DROP POLICY IF EXISTS "staff_insert"                    ON staff;
DROP POLICY IF EXISTS "staff_update"                    ON staff;
DROP POLICY IF EXISTS "staff_delete"                    ON staff;
DROP POLICY IF EXISTS "Owners can manage their staff"   ON staff;

-- Anyone can read staff (needed for public booking page slot availability)
CREATE POLICY "staff_select"
  ON staff FOR SELECT
  USING (true);

-- Authenticated owners can INSERT staff for their own salon
CREATE POLICY "staff_insert"
  ON staff FOR INSERT
  TO authenticated
  WITH CHECK (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- Authenticated owners can UPDATE their own salon's staff
CREATE POLICY "staff_update"
  ON staff FOR UPDATE
  TO authenticated
  USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- Authenticated owners can DELETE their own salon's staff
CREATE POLICY "staff_delete"
  ON staff FOR DELETE
  TO authenticated
  USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );


-- ─────────────────────────────────────────────────────────────────
-- 3. SERVICES TABLE — re-apply RLS (idempotent safety)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can manage their services" ON services;
DROP POLICY IF EXISTS "Public can view services"        ON services;
DROP POLICY IF EXISTS "services_select"                 ON services;
DROP POLICY IF EXISTS "services_insert"                 ON services;
DROP POLICY IF EXISTS "services_update"                 ON services;
DROP POLICY IF EXISTS "services_delete"                 ON services;

-- Public can read services (booking page)
CREATE POLICY "services_select"
  ON services FOR SELECT
  USING (true);

-- Authenticated owners can INSERT directly (fallback if API route fails)
CREATE POLICY "services_insert"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- Authenticated owners can UPDATE
CREATE POLICY "services_update"
  ON services FOR UPDATE
  TO authenticated
  USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- Authenticated owners can DELETE
CREATE POLICY "services_delete"
  ON services FOR DELETE
  TO authenticated
  USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );


-- ─────────────────────────────────────────────────────────────────
-- 4. Performance indexes
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_staff_salon_id     ON staff (salon_id);
CREATE INDEX IF NOT EXISTS idx_staff_salon_active ON staff (salon_id, active);
CREATE INDEX IF NOT EXISTS idx_services_salon_id  ON services (salon_id);


-- ─────────────────────────────────────────────────────────────────
-- 5. VERIFY — confirm policies applied
-- ─────────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('staff', 'services')
ORDER BY tablename, cmd;

-- Check staff columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'staff'
ORDER BY ordinal_position;
