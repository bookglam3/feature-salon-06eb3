-- ============================================================
-- FEATURE SALON — LEVEL 3 FEATURES MIGRATION
-- ============================================================

-- 1. WAITLIST
CREATE TABLE IF NOT EXISTS waitlist (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id      UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_name   TEXT NOT NULL,
  client_email  TEXT,
  client_phone  TEXT,
  service_id    UUID REFERENCES services(id) ON DELETE SET NULL,
  preferred_date DATE,
  preferred_time TEXT,
  notes         TEXT,
  status        TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','contacted','booked','removed')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages waitlist" ON waitlist FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "Public insert waitlist" ON waitlist FOR INSERT WITH CHECK (true);

-- 2. TIPS
CREATE TABLE IF NOT EXISTS tips (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  staff_id        UUID REFERENCES staff(id) ON DELETE SET NULL,
  client_name     TEXT,
  amount          NUMERIC(10,2) NOT NULL,
  method          TEXT DEFAULT 'cash' CHECK (method IN ('cash','card','online')),
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages tips" ON tips FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- 3. GALLERY
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
CREATE POLICY "Owner manages gallery" ON gallery_photos FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "Public reads gallery" ON gallery_photos FOR SELECT USING (true);

-- 4. AUTOMATIONS (birthday, referral rules)
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
CREATE POLICY "Owner manages automations" ON automations FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- 5. REFERRALS
CREATE TABLE IF NOT EXISTS referrals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id        UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  referrer_name   TEXT NOT NULL,
  referrer_email  TEXT,
  referee_name    TEXT,
  referee_email   TEXT,
  code            TEXT NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','rewarded')),
  reward_given    BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages referrals" ON referrals FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_waitlist_salon   ON waitlist(salon_id);
CREATE INDEX IF NOT EXISTS idx_tips_salon       ON tips(salon_id);
CREATE INDEX IF NOT EXISTS idx_gallery_salon    ON gallery_photos(salon_id);
CREATE INDEX IF NOT EXISTS idx_referrals_salon  ON referrals(salon_id);
