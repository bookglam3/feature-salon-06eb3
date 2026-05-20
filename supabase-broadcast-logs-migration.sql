-- ═══════════════════════════════════════════════════════════════
-- BROADCAST LOGS MIGRATION (Super Admin Broadcast Notifications)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → Run)
--
-- Adds:
--   • ONE new column to existing salons table:  marketing_consent
--   • ONE new table:                            broadcast_logs
-- Nothing else is altered.
-- ═══════════════════════════════════════════════════════════════

-- ── Add marketing_consent flag to existing users (salons) table ───
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT TRUE;

-- ── New broadcast_logs table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcast_logs (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject           TEXT NOT NULL,
  message           TEXT NOT NULL,
  channels          JSONB NOT NULL DEFAULT '[]'::jsonb,   -- e.g. ["email","sms"]
  countries         JSONB NOT NULL DEFAULT '[]'::jsonb,   -- e.g. ["GB","PK"] or ["ALL"]
  recipient_type    TEXT NOT NULL CHECK (recipient_type IN ('registered','all')),
  total_sent        INT  NOT NULL DEFAULT 0,
  total_failed      INT  NOT NULL DEFAULT 0,
  sent_by_admin_id  UUID,
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status            TEXT NOT NULL DEFAULT 'success'
                       CHECK (status IN ('success','partial','failed','sending'))
);

CREATE INDEX IF NOT EXISTS idx_broadcast_logs_sent_at
  ON broadcast_logs (sent_at DESC);

-- ── RLS — super admin only ────────────────────────────────────────
ALTER TABLE broadcast_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_only" ON broadcast_logs;
CREATE POLICY "super_admin_only" ON broadcast_logs
  FOR ALL
  USING (auth.jwt() ->> 'email' = 'adilgill2008@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'adilgill2008@gmail.com');

-- ── Verify ───────────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'broadcast_logs'
ORDER BY ordinal_position;
