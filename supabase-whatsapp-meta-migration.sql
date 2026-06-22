-- ─────────────────────────────────────────────────────────────────────────────
-- WhatsApp Cloud API (Meta) — Additive migration
-- Run in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS guards throughout).
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 1: whatsapp_messages
-- Logs every outbound send and inbound receive for auditability and
-- delivery-status tracking via the Meta webhook.
-- salon_id is nullable: inbound messages (direction='inbound') have no salon.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id        UUID        REFERENCES salons(id) ON DELETE CASCADE,
  appointment_id  UUID        REFERENCES appointments(id) ON DELETE SET NULL,
  recipient_e164  TEXT        NOT NULL,               -- E.164 digits, no leading '+'
  direction       TEXT        NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  template_name   TEXT,                               -- NULL for free-form text messages
  wamid           TEXT        UNIQUE,                 -- Meta's message ID (wamid.xxx…)
  status          TEXT        NOT NULL DEFAULT 'pending',
  error_code      INTEGER,                            -- populated on status='failed'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for webhook status-update lookups (by wamid)
CREATE INDEX IF NOT EXISTS idx_wa_messages_wamid
  ON whatsapp_messages (wamid)
  WHERE wamid IS NOT NULL;

-- Index for dashboard queries (salon owner sees their own messages)
CREATE INDEX IF NOT EXISTS idx_wa_messages_salon
  ON whatsapp_messages (salon_id, created_at DESC)
  WHERE salon_id IS NOT NULL;

-- Index for idempotency check (appointment → outbound messages)
CREATE INDEX IF NOT EXISTS idx_wa_messages_appt
  ON whatsapp_messages (appointment_id, direction)
  WHERE appointment_id IS NOT NULL;

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Salon owners can read their own outbound messages (for delivery-status dashboard)
DROP POLICY IF EXISTS "wa_messages_owner_select" ON whatsapp_messages;
CREATE POLICY "wa_messages_owner_select" ON whatsapp_messages
  FOR SELECT TO authenticated
  USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- No INSERT/UPDATE/DELETE for authenticated role:
-- All writes go through service-role (cron + webhook handler).

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 2: whatsapp_service_windows
-- Tracks the last time each customer phone number messaged us inbound.
-- The 24-hour customer service window is open while:
--   NOW() - last_inbound_at < INTERVAL '24 hours'
-- No salon_id: a customer's window is platform-wide (Meta requires it).
-- Accessible only via service-role (webhook + cron). No authenticated policies.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS whatsapp_service_windows (
  recipient_e164  TEXT        PRIMARY KEY,            -- E.164 digits, no leading '+'
  last_inbound_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE whatsapp_service_windows ENABLE ROW LEVEL SECURITY;

-- No policies → authenticated/anon roles get zero access.
-- Service role bypasses RLS and can read/write freely.

COMMIT;
