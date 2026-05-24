-- ═══════════════════════════════════════════════════════════════
-- Feature Salon — RBAC Migration
-- Run in: Supabase Dashboard → SQL Editor → Paste → Run
-- Safe to re-run (DROP IF EXISTS before every CREATE)
-- ═══════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- 1. ADMIN ROLE ENUM
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM (
    'super_admin',    -- Platform owner — full access
    'ops_manager',    -- View all salons/appointments, no edits
    'support_agent',  -- Tickets and complaints only
    'sales_agent',    -- View + onboard new salons
    'developer'       -- Staging/test data only
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 2. ADMIN USERS TABLE
-- Maps auth.users rows to an admin role. Normal salon owners
-- are NOT in this table — they're in the salons table.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          admin_role  NOT NULL,
  full_name     text        NOT NULL,
  email         text        NOT NULL,
  is_active     boolean     NOT NULL DEFAULT true,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid        REFERENCES auth.users(id),
  last_login_at timestamptz,
  CONSTRAINT admin_users_email_key UNIQUE (email)
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────
-- 3. SUPPORT TICKETS TABLE
-- For support_agent role — complaints and help requests.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id    uuid        REFERENCES salons(id) ON DELETE SET NULL,
  subject     text        NOT NULL,
  description text        NOT NULL,
  status      text        NOT NULL DEFAULT 'open'
                          CHECK (status IN ('open','in_progress','resolved','closed')),
  priority    text        NOT NULL DEFAULT 'normal'
                          CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to uuid        REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────
-- 4. ADMIN AUDIT LOG
-- Immutable record of every admin action.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid        REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_role  admin_role,
  action      text        NOT NULL,  -- e.g. "update_salon", "create_admin_user"
  resource    text        NOT NULL,  -- table name
  resource_id text,                  -- row id that was affected
  old_data    jsonb,
  new_data    jsonb,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────
-- 5. STAGING FLAG ON SALONS
-- Developer role can only see rows where is_staging = true.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE salons ADD COLUMN IF NOT EXISTS is_staging boolean NOT NULL DEFAULT false;


-- ─────────────────────────────────────────────────────────────
-- 6. HELPER FUNCTIONS
-- SECURITY DEFINER so they bypass RLS when checking roles —
-- the calling policy uses the result, not the function's privileges.
-- ─────────────────────────────────────────────────────────────

-- Returns the current user's admin role, NULL if not an admin.
CREATE OR REPLACE FUNCTION get_admin_role()
RETURNS admin_role
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role
  FROM   admin_users
  WHERE  id = auth.uid()
  AND    is_active = true
  LIMIT  1;
$$;

-- True if the current user has exactly the requested role.
CREATE OR REPLACE FUNCTION is_admin_role(required_role admin_role)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE  id        = auth.uid()
    AND    role      = required_role
    AND    is_active = true
  );
$$;

-- True if the current user is super_admin.
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT is_admin_role('super_admin');
$$;

-- True if the current user is ANY active admin.
CREATE OR REPLACE FUNCTION is_any_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE  id = auth.uid() AND is_active = true
  );
$$;

-- True if the current user's role is in the supplied array.
CREATE OR REPLACE FUNCTION has_admin_role(roles admin_role[])
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE  id        = auth.uid()
    AND    role      = ANY(roles)
    AND    is_active = true
  );
$$;


-- ─────────────────────────────────────────────────────────────
-- 7. RLS — admin_users
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "super_admin full access on admin_users" ON admin_users;
CREATE POLICY "super_admin full access on admin_users" ON admin_users
  FOR ALL
  USING  (is_super_admin())
  WITH CHECK (is_super_admin());

-- Every admin can read their own row (to fetch their own role).
DROP POLICY IF EXISTS "admin reads own row" ON admin_users;
CREATE POLICY "admin reads own row" ON admin_users
  FOR SELECT
  USING (id = auth.uid() AND is_active = true);


-- ─────────────────────────────────────────────────────────────
-- 8. RLS — salons (add admin policies on top of existing owner policy)
-- Existing owner policy stays — these are additive (ORed together).
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "super_admin full access on salons" ON salons;
CREATE POLICY "super_admin full access on salons" ON salons
  FOR ALL
  USING  (is_super_admin())
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "ops_manager read salons" ON salons;
CREATE POLICY "ops_manager read salons" ON salons
  FOR SELECT
  USING (is_admin_role('ops_manager'));

DROP POLICY IF EXISTS "sales_agent read salons" ON salons;
CREATE POLICY "sales_agent read salons" ON salons
  FOR SELECT
  USING (is_admin_role('sales_agent'));

DROP POLICY IF EXISTS "sales_agent create salons" ON salons;
CREATE POLICY "sales_agent create salons" ON salons
  FOR INSERT
  WITH CHECK (is_admin_role('sales_agent'));

-- Developer: read-only on test/staging salons only.
DROP POLICY IF EXISTS "developer read staging salons" ON salons;
CREATE POLICY "developer read staging salons" ON salons
  FOR SELECT
  USING (is_admin_role('developer') AND is_staging = true);


-- ─────────────────────────────────────────────────────────────
-- 9. RLS — appointments (admin read access)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "super_admin full access on appointments" ON appointments;
CREATE POLICY "super_admin full access on appointments" ON appointments
  FOR ALL
  USING  (is_super_admin())
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "ops_manager read appointments" ON appointments;
CREATE POLICY "ops_manager read appointments" ON appointments
  FOR SELECT
  USING (is_admin_role('ops_manager'));

DROP POLICY IF EXISTS "developer read staging appointments" ON appointments;
CREATE POLICY "developer read staging appointments" ON appointments
  FOR SELECT
  USING (
    is_admin_role('developer') AND
    salon_id IN (SELECT id FROM salons WHERE is_staging = true)
  );


-- ─────────────────────────────────────────────────────────────
-- 10. RLS — support_tickets
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "super_admin full access on support_tickets" ON support_tickets;
CREATE POLICY "super_admin full access on support_tickets" ON support_tickets
  FOR ALL
  USING  (is_super_admin())
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "support_agent read tickets" ON support_tickets;
CREATE POLICY "support_agent read tickets" ON support_tickets
  FOR SELECT
  USING (is_admin_role('support_agent'));

DROP POLICY IF EXISTS "support_agent update tickets" ON support_tickets;
CREATE POLICY "support_agent update tickets" ON support_tickets
  FOR UPDATE
  USING     (is_admin_role('support_agent'))
  WITH CHECK (is_admin_role('support_agent'));

DROP POLICY IF EXISTS "ops_manager read tickets" ON support_tickets;
CREATE POLICY "ops_manager read tickets" ON support_tickets
  FOR SELECT
  USING (is_admin_role('ops_manager'));


-- ─────────────────────────────────────────────────────────────
-- 11. RLS — admin_audit_log
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "super_admin full access on admin_audit_log" ON admin_audit_log;
CREATE POLICY "super_admin full access on admin_audit_log" ON admin_audit_log
  FOR ALL
  USING  (is_super_admin())
  WITH CHECK (is_super_admin());

-- Admins can read only their own audit entries.
DROP POLICY IF EXISTS "admin reads own audit log" ON admin_audit_log;
CREATE POLICY "admin reads own audit log" ON admin_audit_log
  FOR SELECT
  USING (admin_id = auth.uid() AND is_any_admin());

-- Service-role inserts go through backend — RLS bypassed by service key.


-- ─────────────────────────────────────────────────────────────
-- 12. INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_admin_users_role
  ON admin_users(role) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_support_tickets_status
  ON support_tickets(status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_salon
  ON support_tickets(salon_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id
  ON admin_audit_log(admin_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_created
  ON admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_salons_staging
  ON salons(is_staging) WHERE is_staging = true;


-- ─────────────────────────────────────────────────────────────
-- 13. INSERT YOURSELF AS SUPER ADMIN
-- Uncomment, replace YOUR_USER_ID with your auth.users id.
-- Find it: Supabase Dashboard → Authentication → Users → your row
-- ─────────────────────────────────────────────────────────────
-- INSERT INTO admin_users (id, role, full_name, email, created_by)
-- VALUES (
--   'YOUR_USER_ID_HERE',
--   'super_admin',
--   'Your Name',
--   'bookfeature31@gmail.com',
--   'YOUR_USER_ID_HERE'
-- )
-- ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- VERIFY — should show 3 new tables with policies
-- ─────────────────────────────────────────────────────────────
SELECT
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE tablename IN ('admin_users','support_tickets','admin_audit_log','salons','appointments')
GROUP BY tablename
ORDER BY tablename;
