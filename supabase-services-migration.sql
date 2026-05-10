-- ═══════════════════════════════════════════════════════════════════
-- COMPLETE SERVICES + SUPPORTING MIGRATION
-- Run this in Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (all statements use IF NOT EXISTS / DROP IF EXISTS)
--
-- What this does:
--   1. Adds  description  column to services
--   2. Fixes services RLS policies (SELECT open, INSERT/UPDATE/DELETE via service-role API)
--   3. Adds performance index on services(salon_id)
--   4. Ensures appointments.status supports: confirmed, pending, cancelled, completed, no_show
--   5. Ensures staff.active column has a proper default
--   6. Verifies everything at the end
-- ═══════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────
-- 1. SERVICES — add description column
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS description TEXT;


-- ─────────────────────────────────────────────────────────────────
-- 2. SERVICES — performance index
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_services_salon_id ON services (salon_id);


-- ─────────────────────────────────────────────────────────────────
-- 3. SERVICES — RLS
-- NOTE: INSERT / UPDATE / DELETE are now handled by /api/services
-- which uses SERVICE_ROLE_KEY (bypasses RLS).
-- We only need SELECT open so booking page can read them without auth.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop all old policies first (safe)
DROP POLICY IF EXISTS "Owner can manage their services" ON services;
DROP POLICY IF EXISTS "Public can view services"        ON services;
DROP POLICY IF EXISTS "services_select"                 ON services;
DROP POLICY IF EXISTS "services_insert"                 ON services;
DROP POLICY IF EXISTS "services_update"                 ON services;
DROP POLICY IF EXISTS "services_delete"                 ON services;

-- Anyone can read (needed for public booking page — no login required)
CREATE POLICY "services_select"
  ON services FOR SELECT
  USING (true);

-- Authenticated owners can still INSERT directly (fallback safety)
CREATE POLICY "services_insert"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- Authenticated owners can UPDATE directly (fallback safety)
CREATE POLICY "services_update"
  ON services FOR UPDATE
  TO authenticated
  USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- Authenticated owners can DELETE directly (fallback safety)
CREATE POLICY "services_delete"
  ON services FOR DELETE
  TO authenticated
  USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );


-- ─────────────────────────────────────────────────────────────────
-- 4. APPOINTMENTS — support no_show and completed statuses
-- Remove old CHECK constraint if it blocks new status values
-- ─────────────────────────────────────────────────────────────────

-- Drop old check constraint if it exists (common name patterns)
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appt_status_check;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS check_status;

-- Add new constraint with all valid statuses
ALTER TABLE appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'));


-- ─────────────────────────────────────────────────────────────────
-- 5. STAFF — ensure active column exists with proper default
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- Backfill: set any NULL active values to TRUE
UPDATE staff SET active = TRUE WHERE active IS NULL;

-- Index for fast active-staff queries (booking page filter)
CREATE INDEX IF NOT EXISTS idx_staff_salon_active ON staff (salon_id, active);


-- ─────────────────────────────────────────────────────────────────
-- 6. APPOINTMENTS — index for faster dashboard queries
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_appts_salon_datetime ON appointments (salon_id, date_time);
CREATE INDEX IF NOT EXISTS idx_appts_salon_status   ON appointments (salon_id, status);


-- ─────────────────────────────────────────────────────────────────
-- 7. VERIFY — run these SELECT statements to confirm everything worked
-- ─────────────────────────────────────────────────────────────────

-- Check services columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'services'
ORDER BY ordinal_position;

-- Check RLS policies on services
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'services'
ORDER BY cmd;

-- Check staff active column
SELECT id, name, active
FROM staff
LIMIT 10;

-- Check your services with description
SELECT id, name, price, duration_minutes, description
FROM services
LIMIT 10;
