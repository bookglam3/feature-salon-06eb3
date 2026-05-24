-- ═══════════════════════════════════════════════════════════════
-- Feature Salon — Employee Invite System Migration
-- Depends on: supabase-rbac-migration.sql (admin_role enum,
--             admin_users table, helper functions)
-- Run in: Supabase Dashboard → SQL Editor → Paste → Run
-- ═══════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- 1. ADMIN INVITES TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_invites (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who & what
  email       text        NOT NULL,
  role        admin_role  NOT NULL,
  full_name   text,                        -- pre-filled name (optional)
  note        text,                        -- personal message in invite email

  -- Invite token — random 64-hex chars, used as the URL secret
  token       text        NOT NULL,
  CONSTRAINT  admin_invites_token_key UNIQUE (token),

  -- Lifecycle
  status      text        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  invited_by  uuid        NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  accepted_at timestamptz,
  accepted_uid uuid       REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 2. RLS POLICIES — admin_invites
-- ─────────────────────────────────────────────────────────────

-- Super admin: full access (create, revoke, view all)
DROP POLICY IF EXISTS "super_admin full access on admin_invites" ON admin_invites;
CREATE POLICY "super_admin full access on admin_invites" ON admin_invites
  FOR ALL
  USING  (is_super_admin())
  WITH CHECK (is_super_admin());

-- Service role used by API routes bypasses RLS automatically.
-- No anon policy needed — the accept page uses a server-side API
-- route with the service-role key.

-- ─────────────────────────────────────────────────────────────
-- 3. AUTO-EXPIRE FUNCTION
-- Marks old pending invites as 'expired' so the UI is clean.
-- Call this in a pg_cron job if you want it automatic, or the
-- API route filters on expires_at anyway.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS void
LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE admin_invites
  SET    status = 'expired'
  WHERE  status = 'pending'
  AND    expires_at < now();
$$;

-- ─────────────────────────────────────────────────────────────
-- 4. INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_admin_invites_token
  ON admin_invites(token);

CREATE INDEX IF NOT EXISTS idx_admin_invites_email
  ON admin_invites(email);

CREATE INDEX IF NOT EXISTS idx_admin_invites_status
  ON admin_invites(status) WHERE status = 'pending';

-- ─────────────────────────────────────────────────────────────
-- VERIFY
-- ─────────────────────────────────────────────────────────────
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'admin_invites'
ORDER BY cmd;
