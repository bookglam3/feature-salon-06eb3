-- ═══════════════════════════════════════════════════════════════
-- 🚨 URGENT FIX — Run this in Supabase SQL Editor RIGHT NOW
-- Error: "new row violates row-level security policy for table appointments"
-- ═══════════════════════════════════════════════════════════════

-- 1. Check current RLS status on appointments
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'appointments';

-- 2. Check existing policies
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'appointments';

-- 3. FIX: Allow anonymous users to INSERT appointments (public booking page)
DROP POLICY IF EXISTS "Allow anon insert" ON appointments;
CREATE POLICY "Allow anon insert"
  ON appointments
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 4. FIX: Allow anonymous users to SELECT appointments (slot availability check)
DROP POLICY IF EXISTS "Allow anon select" ON appointments;
CREATE POLICY "Allow anon select"
  ON appointments
  FOR SELECT
  TO anon
  USING (true);

-- 5. Allow authenticated users (dashboard) full access
DROP POLICY IF EXISTS "Allow authenticated full access" ON appointments;
CREATE POLICY "Allow authenticated full access"
  ON appointments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Verify policies now exist
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY cmd;
