-- ═══════════════════════════════════════════════════════════════
-- Feature Salon — Audit Log Enhancement
-- Depends on: supabase-rbac-migration.sql (admin_audit_log table)
-- Run in: Supabase Dashboard → SQL Editor → Paste → Run
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. ADD MISSING COLUMNS to admin_audit_log
-- ─────────────────────────────────────────────────────────────
ALTER TABLE admin_audit_log
  ADD COLUMN IF NOT EXISTS salon_id uuid REFERENCES salons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS details  text;   -- human-readable description

-- ─────────────────────────────────────────────────────────────
-- 2. EXTRA INDEXES for fast filtering
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_log_action   ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON admin_audit_log(resource);
CREATE INDEX IF NOT EXISTS idx_audit_log_salon    ON admin_audit_log(salon_id);

-- ─────────────────────────────────────────────────────────────
-- 3. 90-DAY AUTO-DELETE FUNCTION
-- Schedule with pg_cron (Supabase supports it on Pro plan).
-- On free plan: call it manually or via an edge function cron.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION delete_old_audit_logs()
RETURNS void
LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM admin_audit_log
  WHERE created_at < now() - interval '90 days';
$$;

-- ─────────────────────────────────────────────────────────────
-- 4. pg_cron JOB — runs daily at 02:00 UTC
-- Only available on Supabase Pro. Skip if on free plan.
-- ─────────────────────────────────────────────────────────────
-- SELECT cron.schedule(
--   'delete-old-audit-logs',
--   '0 2 * * *',
--   $$SELECT delete_old_audit_logs()$$
-- );

-- ─────────────────────────────────────────────────────────────
-- 5. VERIFY
-- ─────────────────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'admin_audit_log'
ORDER BY ordinal_position;
