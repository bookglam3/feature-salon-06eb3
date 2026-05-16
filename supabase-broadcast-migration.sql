-- ═══════════════════════════════════════════════════════════════
-- BROADCAST MESSAGES TABLE MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → Run)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS broadcast_messages (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id       UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  message        TEXT NOT NULL,
  channel        TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  recipient_count INT  DEFAULT 0,
  status         TEXT DEFAULT 'sending' CHECK (status IN ('sending', 'sent', 'partial', 'failed')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup per salon
CREATE INDEX IF NOT EXISTS idx_broadcast_salon ON broadcast_messages (salon_id, created_at DESC);

-- RLS: salon owners can only see their own broadcasts
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owner access" ON broadcast_messages
  FOR ALL USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'broadcast_messages'
ORDER BY ordinal_position;
