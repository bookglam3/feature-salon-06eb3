-- ═══════════════════════════════════════════════════════════════
-- FIX: Overly permissive RLS policies (USING true → owner-scoped)
-- Run in: Supabase Dashboard → SQL Editor → Paste → Run
-- Safe to re-run (uses DROP IF EXISTS before every CREATE)
-- ═══════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- 1. broadcast_messages
--    Only the salon owner should read/write their broadcasts.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all on broadcast_messages" ON broadcast_messages;
DROP POLICY IF EXISTS "Salon owner access"              ON broadcast_messages;

CREATE POLICY "Salon owner access" ON broadcast_messages
  FOR ALL
  USING  (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 2. loyalty_points
--    Salon owner manages all loyalty records for their clients.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all on loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "Salon owner access"          ON loyalty_points;

CREATE POLICY "Salon owner access" ON loyalty_points
  FOR ALL
  USING  (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 3. loyalty_transactions
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all on loyalty_transactions" ON loyalty_transactions;
DROP POLICY IF EXISTS "Salon owner access"                ON loyalty_transactions;

CREATE POLICY "Salon owner access" ON loyalty_transactions
  FOR ALL
  USING  (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 4. waitlist
--    Salon owner manages the waitlist; public clients can add
--    themselves via the booking page (anon INSERT).
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all on waitlist"  ON waitlist;
DROP POLICY IF EXISTS "Owner manages waitlist" ON waitlist;
DROP POLICY IF EXISTS "Public insert waitlist" ON waitlist;

CREATE POLICY "Owner manages waitlist" ON waitlist
  FOR ALL
  USING  (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE POLICY "Public insert waitlist" ON waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- 5. discount_codes
--    Salon owner manages codes; public can read to validate a
--    promo code on the booking page.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all on discount_codes" ON discount_codes;
DROP POLICY IF EXISTS "Salon owner access"          ON discount_codes;
DROP POLICY IF EXISTS "Public reads discount codes" ON discount_codes;

CREATE POLICY "Salon owner access" ON discount_codes
  FOR ALL
  USING  (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE POLICY "Public reads discount codes" ON discount_codes
  FOR SELECT
  TO anon
  USING (is_active = true);


-- ─────────────────────────────────────────────────────────────
-- 6. gift_cards
--    Salon owner manages gift cards; public can look up a card
--    by code to check balance during booking.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all on gift_cards" ON gift_cards;
DROP POLICY IF EXISTS "Salon owner access"      ON gift_cards;
DROP POLICY IF EXISTS "Public reads gift cards" ON gift_cards;

CREATE POLICY "Salon owner access" ON gift_cards
  FOR ALL
  USING  (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE POLICY "Public reads gift cards" ON gift_cards
  FOR SELECT
  TO anon
  USING (true);


-- ─────────────────────────────────────────────────────────────
-- 7. Drop old duplicate policies (leftover from previous migrations)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner manages broadcasts"           ON broadcast_messages;
DROP POLICY IF EXISTS "Salon owner discount access"        ON discount_codes;
DROP POLICY IF EXISTS "Salon owner gift card access"       ON gift_cards;
DROP POLICY IF EXISTS "Owner manages loyalty_points"       ON loyalty_points;
DROP POLICY IF EXISTS "Salon owner loyalty access"         ON loyalty_points;
DROP POLICY IF EXISTS "Owner manages loyalty_transactions"  ON loyalty_transactions;
DROP POLICY IF EXISTS "Salon owner loyalty tx access"      ON loyalty_transactions;
DROP POLICY IF EXISTS "Salon owner waitlist access"        ON waitlist;


-- ─────────────────────────────────────────────────────────────
-- Verify — all six tables should appear below
-- ─────────────────────────────────────────────────────────────
SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN (
  'broadcast_messages',
  'loyalty_points',
  'loyalty_transactions',
  'waitlist',
  'discount_codes',
  'gift_cards'
)
ORDER BY tablename, cmd;
