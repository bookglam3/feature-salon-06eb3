-- ═══════════════════════════════════════════════════════════════
-- Feature Salon — 2FA Migration
-- Depends on: supabase-rbac-migration.sql
-- Run in: Supabase Dashboard → SQL Editor → Paste → Run
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. ADD 2FA COLUMNS TO admin_users
-- ─────────────────────────────────────────────────────────────
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS totp_enabled      boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS totp_secret       text,
  ADD COLUMN IF NOT EXISTS totp_enrolled_at  timestamptz;

-- ─────────────────────────────────────────────────────────────
-- 2. BACKUP CODES TABLE
-- Each code is a one-time-use SHA-256 hash.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_backup_codes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   uuid        NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  code_hash  text        NOT NULL,
  used       boolean     NOT NULL DEFAULT false,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_backup_codes ENABLE ROW LEVEL SECURITY;

-- Super admin can see all backup code rows (for resets)
DROP POLICY IF EXISTS "super_admin manages backup codes" ON admin_backup_codes;
CREATE POLICY "super_admin manages backup codes" ON admin_backup_codes
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Service role (API routes) bypasses RLS automatically.

-- ─────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_backup_codes_admin
  ON admin_backup_codes(admin_id) WHERE used = false;

-- ─────────────────────────────────────────────────────────────
-- VERIFY
-- ─────────────────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'admin_users'
  AND column_name IN ('totp_enabled', 'totp_secret', 'totp_enrolled_at')
ORDER BY column_name;
