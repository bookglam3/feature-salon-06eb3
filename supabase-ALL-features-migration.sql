-- ============================================================
-- FEATURE SALON — ALL NEW FEATURES MIGRATION
-- Supabase SQL Editor mein paste karke RUN karein
-- ============================================================

-- 1. CLOSED DATES
CREATE TABLE IF NOT EXISTS closed_dates (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id   UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id, date)
);
ALTER TABLE closed_dates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='closed_dates' AND policyname='Owner manages closed_dates') THEN
    CREATE POLICY "Owner manages closed_dates" ON closed_dates FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='closed_dates' AND policyname='Public reads closed_dates') THEN
    CREATE POLICY "Public reads closed_dates" ON closed_dates FOR SELECT USING (true);
  END IF;
END $$;

-- 2. LOYALTY POINTS
CREATE TABLE IF NOT EXISTS loyalty_points (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id       UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_email   TEXT NOT NULL,
  client_name    TEXT NOT NULL,
  points         INTEGER DEFAULT 0,
  total_earned   INTEGER DEFAULT 0,
  total_redeemed INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id, client_email)
);
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='loyalty_points' AND policyname='Owner manages loyalty_points') THEN
    CREATE POLICY "Owner manages loyalty_points" ON loyalty_points FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id     UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  points       INTEGER NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('earn','redeem','bonus','expire')),
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='loyalty_transactions' AND policyname='Owner manages loyalty_transactions') THEN
    CREATE POLICY "Owner manages loyalty_transactions" ON loyalty_transactions FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
  END IF;
END $$;

-- 3. BROADCAST MESSAGES
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  channel         TEXT NOT NULL CHECK (channel IN ('whatsapp','sms','email')),
  recipient_count INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'sent',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='broadcast_messages' AND policyname='Owner manages broadcasts') THEN
    CREATE POLICY "Owner manages broadcasts" ON broadcast_messages FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
  END IF;
END $$;

-- 4. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id       UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  client_name    TEXT NOT NULL,
  client_email   TEXT,
  items          JSONB DEFAULT '[]',
  subtotal       NUMERIC(10,2) DEFAULT 0,
  tax_rate       NUMERIC(5,2) DEFAULT 20,
  tax_amount     NUMERIC(10,2) DEFAULT 0,
  total          NUMERIC(10,2) DEFAULT 0,
  status         TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid')),
  due_date       DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='invoices' AND policyname='Owner manages invoices') THEN
    CREATE POLICY "Owner manages invoices" ON invoices FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
  END IF;
END $$;

-- 5. WAITLIST
CREATE TABLE IF NOT EXISTS waitlist (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id       UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_name    TEXT NOT NULL,
  client_email   TEXT,
  client_phone   TEXT,
  service_id     UUID REFERENCES services(id) ON DELETE SET NULL,
  preferred_date DATE,
  preferred_time TEXT,
  notes          TEXT,
  status         TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','contacted','booked','removed')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='waitlist' AND policyname='Owner manages waitlist') THEN
    CREATE POLICY "Owner manages waitlist" ON waitlist FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='waitlist' AND policyname='Public insert waitlist') THEN
    CREATE POLICY "Public insert waitlist" ON waitlist FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 6. TIPS
CREATE TABLE IF NOT EXISTS tips (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id       UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  staff_id       UUID REFERENCES staff(id) ON DELETE SET NULL,
  client_name    TEXT,
  amount         NUMERIC(10,2) NOT NULL,
  method         TEXT DEFAULT 'cash' CHECK (method IN ('cash','card','online')),
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tips' AND policyname='Owner manages tips') THEN
    CREATE POLICY "Owner manages tips" ON tips FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
  END IF;
END $$;

-- 7. GALLERY
CREATE TABLE IF NOT EXISTS gallery_photos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id    UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  caption     TEXT,
  category    TEXT DEFAULT 'general',
  is_featured BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gallery_photos' AND policyname='Owner manages gallery') THEN
    CREATE POLICY "Owner manages gallery" ON gallery_photos FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gallery_photos' AND policyname='Public reads gallery') THEN
    CREATE POLICY "Public reads gallery" ON gallery_photos FOR SELECT USING (true);
  END IF;
END $$;

-- 8. AUTOMATIONS
CREATE TABLE IF NOT EXISTS automations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id    UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('birthday','referral','winback','anniversary')),
  is_active   BOOLEAN DEFAULT true,
  channel     TEXT DEFAULT 'whatsapp',
  message     TEXT NOT NULL,
  days_before INTEGER DEFAULT 0,
  reward      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id, type)
);
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='automations' AND policyname='Owner manages automations') THEN
    CREATE POLICY "Owner manages automations" ON automations FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
  END IF;
END $$;

-- 9. REFERRALS
CREATE TABLE IF NOT EXISTS referrals (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id       UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  referrer_name  TEXT NOT NULL,
  referrer_email TEXT,
  referee_name   TEXT,
  referee_email  TEXT,
  code           TEXT NOT NULL,
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','rewarded')),
  reward_given   BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='referrals' AND policyname='Owner manages referrals') THEN
    CREATE POLICY "Owner manages referrals" ON referrals FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
  END IF;
END $$;

-- 10. INDEXES
CREATE INDEX IF NOT EXISTS idx_closed_dates_salon   ON closed_dates(salon_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_salon_email  ON loyalty_points(salon_id, client_email);
CREATE INDEX IF NOT EXISTS idx_invoices_salon       ON invoices(salon_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_salon      ON broadcast_messages(salon_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_salon       ON waitlist(salon_id);
CREATE INDEX IF NOT EXISTS idx_tips_salon           ON tips(salon_id);
CREATE INDEX IF NOT EXISTS idx_gallery_salon        ON gallery_photos(salon_id);
CREATE INDEX IF NOT EXISTS idx_referrals_salon      ON referrals(salon_id);

-- DONE!
SELECT 'All tables created successfully!' AS result;
