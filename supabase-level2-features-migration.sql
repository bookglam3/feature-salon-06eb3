-- ============================================================
-- FEATURE SALON — LEVEL 1 & 2 FEATURES MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. CLOSED DATES / HOLIDAYS
CREATE TABLE IF NOT EXISTS closed_dates (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id    UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id, date)
);
ALTER TABLE closed_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages closed_dates" ON closed_dates FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "Public reads closed_dates" ON closed_dates FOR SELECT USING (true);

-- 2. LOYALTY POINTS
CREATE TABLE IF NOT EXISTS loyalty_points (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_email    TEXT NOT NULL,
  client_name     TEXT NOT NULL,
  points          INTEGER DEFAULT 0,
  total_earned    INTEGER DEFAULT 0,
  total_redeemed  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id, client_email)
);
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages loyalty_points" ON loyalty_points FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id      UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_email  TEXT NOT NULL,
  points        INTEGER NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'expire')),
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages loyalty_transactions" ON loyalty_transactions FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- 3. BROADCAST MESSAGES LOG
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id      UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  channel       TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
  recipient_count INTEGER DEFAULT 0,
  status        TEXT DEFAULT 'sent',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages broadcasts" ON broadcast_messages FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- 4. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  invoice_number  TEXT NOT NULL,
  client_name     TEXT NOT NULL,
  client_email    TEXT,
  items           JSONB DEFAULT '[]',
  subtotal        NUMERIC(10,2) DEFAULT 0,
  tax_rate        NUMERIC(5,2) DEFAULT 20,
  tax_amount      NUMERIC(10,2) DEFAULT 0,
  total           NUMERIC(10,2) DEFAULT 0,
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid')),
  due_date        DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages invoices" ON invoices FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_closed_dates_salon    ON closed_dates(salon_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_salon_email   ON loyalty_points(salon_id, client_email);
CREATE INDEX IF NOT EXISTS idx_invoices_salon        ON invoices(salon_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_salon       ON broadcast_messages(salon_id);
