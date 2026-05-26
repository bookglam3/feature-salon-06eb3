-- ================================================================
-- Feature Salon — LUXE HAIR & BEAUTY  (Play Store screenshot demo)
-- ================================================================
-- Login:  demo.luxe@featuresalon.co.uk  /  PlayStore2026!
-- Run once in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to re-run (all inserts are ON CONFLICT DO NOTHING)
-- Does NOT touch any existing account or real data.
-- ================================================================

-- ── 0. SAFETY: ensure columns exist ─────────────────────────────
ALTER TABLE salons ADD COLUMN IF NOT EXISTS is_demo_data      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS subscription_plan TEXT             DEFAULT 'starter';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- ── 1. AUTH USER ─────────────────────────────────────────────────
--   email   : demo.luxe@featuresalon.co.uk
--   password: PlayStore2026!
--   UUID    : b2000001-0000-4000-8000-000000000001
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b2000001-0000-4000-8000-000000000001',
  'authenticated', 'authenticated',
  'demo.luxe@featuresalon.co.uk',
  crypt('PlayStore2026!', gen_salt('bf')),
  NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Luxe Demo"}',
  NOW() - INTERVAL '8 months', NOW(),
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) VALUES (
  'demo.luxe@featuresalon.co.uk',
  'b2000001-0000-4000-8000-000000000001',
  '{"sub":"b2000001-0000-4000-8000-000000000001","email":"demo.luxe@featuresalon.co.uk","email_verified":true}',
  'email',
  NOW(), NOW() - INTERVAL '8 months', NOW()
) ON CONFLICT (provider_id, provider) DO NOTHING;

-- ── 2. SALON ─────────────────────────────────────────────────────
INSERT INTO salons (
  id, name, slug, owner_id, owner_email,
  plan, subscription_status, subscription_plan,
  business_type, trial_ends_at, created_at, is_demo_data
) VALUES (
  'a2000001-0000-4000-8000-000000000001',
  'Luxe Hair & Beauty',
  'luxe-hair-beauty',
  'b2000001-0000-4000-8000-000000000001',
  'demo.luxe@featuresalon.co.uk',
  'pro', 'active', 'pro',
  'hair',
  NULL,
  NOW() - INTERVAL '8 months',
  true
) ON CONFLICT (id) DO NOTHING;

-- ── 3. SERVICES ──────────────────────────────────────────────────
INSERT INTO services (id, salon_id, name, price, duration_minutes, description, category, created_at) VALUES
(
  'd4000001-0000-4000-8000-000000000001',
  'a2000001-0000-4000-8000-000000000001',
  'Haircut', 25.00, 45,
  'Precision cut styled to your preference', 'Hair',
  NOW() - INTERVAL '8 months'
),(
  'd4000001-0000-4000-8000-000000000002',
  'a2000001-0000-4000-8000-000000000001',
  'Hair Colour', 60.00, 90,
  'Full colour treatment with premium products', 'Hair',
  NOW() - INTERVAL '8 months'
),(
  'd4000001-0000-4000-8000-000000000003',
  'a2000001-0000-4000-8000-000000000001',
  'Blow Dry', 20.00, 30,
  'Professional blow dry and finish', 'Hair',
  NOW() - INTERVAL '8 months'
),(
  'd4000001-0000-4000-8000-000000000004',
  'a2000001-0000-4000-8000-000000000001',
  'Beard Trim', 15.00, 20,
  'Shape and trim with hot towel finish', 'Barber',
  NOW() - INTERVAL '8 months'
),(
  'd4000001-0000-4000-8000-000000000005',
  'a2000001-0000-4000-8000-000000000001',
  'Manicure', 30.00, 45,
  'Nail shaping, cuticle care, and polish', 'Nails',
  NOW() - INTERVAL '8 months'
),(
  'd4000001-0000-4000-8000-000000000006',
  'a2000001-0000-4000-8000-000000000001',
  'Facial', 40.00, 60,
  'Cleanse, exfoliate, and hydrate', 'Beauty',
  NOW() - INTERVAL '8 months'
)
ON CONFLICT (id) DO NOTHING;

-- ── 4. STAFF ─────────────────────────────────────────────────────
INSERT INTO staff (id, salon_id, name, email, role, active, services, working_hours, created_at) VALUES
(
  'c3000001-0000-4000-8000-000000000001',
  'a2000001-0000-4000-8000-000000000001',
  'Sarah Ahmed',
  'sarah@luxehairbeauty.co.uk',
  'stylist', true,
  '["d4000001-0000-4000-8000-000000000001","d4000001-0000-4000-8000-000000000002","d4000001-0000-4000-8000-000000000003"]',
  '{"mon":{"enabled":true,"start":"09:00","end":"18:00"},"tue":{"enabled":true,"start":"09:00","end":"18:00"},"wed":{"enabled":true,"start":"09:00","end":"18:00"},"thu":{"enabled":true,"start":"09:00","end":"18:00"},"fri":{"enabled":true,"start":"09:00","end":"18:00"},"sat":{"enabled":true,"start":"09:00","end":"17:00"},"sun":{"enabled":false,"start":"09:00","end":"17:00"}}',
  NOW() - INTERVAL '8 months'
),(
  'c3000001-0000-4000-8000-000000000002',
  'a2000001-0000-4000-8000-000000000001',
  'Maria Lopez',
  'maria@luxehairbeauty.co.uk',
  'stylist', true,
  '["d4000001-0000-4000-8000-000000000002","d4000001-0000-4000-8000-000000000005","d4000001-0000-4000-8000-000000000006"]',
  '{"mon":{"enabled":true,"start":"10:00","end":"18:00"},"tue":{"enabled":true,"start":"10:00","end":"18:00"},"wed":{"enabled":false,"start":"10:00","end":"18:00"},"thu":{"enabled":true,"start":"10:00","end":"18:00"},"fri":{"enabled":true,"start":"10:00","end":"18:00"},"sat":{"enabled":true,"start":"09:00","end":"17:00"},"sun":{"enabled":false,"start":"09:00","end":"17:00"}}',
  NOW() - INTERVAL '7 months'
),(
  'c3000001-0000-4000-8000-000000000003',
  'a2000001-0000-4000-8000-000000000001',
  'James Carter',
  'james@luxehairbeauty.co.uk',
  'stylist', true,
  '["d4000001-0000-4000-8000-000000000001","d4000001-0000-4000-8000-000000000004","d4000001-0000-4000-8000-000000000003"]',
  '{"mon":{"enabled":true,"start":"09:00","end":"17:00"},"tue":{"enabled":true,"start":"09:00","end":"17:00"},"wed":{"enabled":true,"start":"09:00","end":"17:00"},"thu":{"enabled":true,"start":"09:00","end":"17:00"},"fri":{"enabled":true,"start":"09:00","end":"17:00"},"sat":{"enabled":false,"start":"09:00","end":"17:00"},"sun":{"enabled":false,"start":"09:00","end":"17:00"}}',
  NOW() - INTERVAL '6 months'
)
ON CONFLICT (id) DO NOTHING;

-- ── 5. APPOINTMENTS ───────────────────────────────────────────────
-- 21 appointments: 2 weeks past (confirmed) + this week (mix) + next week (confirmed)
-- Total confirmed revenue = £680  ·  Pending = £60
-- All times UTC (UK BST = UTC+1, so 09:00 UTC = 10:00 UK time)

INSERT INTO appointments (
  id, salon_id, staff_id, service_id,
  client_name, client_email, client_phone,
  date_time, status, payment_status, payment_method, created_at
) VALUES

-- ── Week of 11–16 May (2 weeks ago, all confirmed) ──────────────
(
  'e5000001-0000-4000-8000-000000000001',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000001',
  'd4000001-0000-4000-8000-000000000002',
  'Charlotte Moore','charlotte.moore@email.co.uk','+44 7700 900101',
  '2026-05-12 09:00:00+00', 'confirmed', 'paid', 'pay_at_salon',
  '2026-05-11 18:00:00+00'
),(
  'e5000001-0000-4000-8000-000000000002',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000002',
  'd4000001-0000-4000-8000-000000000005',
  'Lily Adams','lily.adams@email.co.uk','+44 7700 900102',
  '2026-05-13 13:00:00+00', 'confirmed', 'paid', 'pay_at_salon',
  '2026-05-12 10:00:00+00'
),(
  'e5000001-0000-4000-8000-000000000003',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000003',
  'd4000001-0000-4000-8000-000000000004',
  'Oscar Lee','oscar.lee@email.co.uk','+44 7700 900103',
  '2026-05-14 09:00:00+00', 'confirmed', 'paid', 'pay_at_salon',
  '2026-05-13 11:00:00+00'
),(
  'e5000001-0000-4000-8000-000000000004',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000001',
  'd4000001-0000-4000-8000-000000000002',
  'Megan Walker','megan.walker@email.co.uk','+44 7700 900104',
  '2026-05-15 10:00:00+00', 'confirmed', 'paid', 'pay_at_salon',
  '2026-05-14 09:00:00+00'
),(
  'e5000001-0000-4000-8000-000000000005',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000002',
  'd4000001-0000-4000-8000-000000000006',
  'Isabella Clark','isabella.clark@email.co.uk','+44 7700 900105',
  '2026-05-16 09:00:00+00', 'confirmed', 'paid', 'pay_at_salon',
  '2026-05-15 14:00:00+00'
),

-- ── Week of 18–23 May (last week, all confirmed) ─────────────────
(
  'e5000001-0000-4000-8000-000000000006',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000003',
  'd4000001-0000-4000-8000-000000000001',
  'Noah Thompson','noah.thompson@email.co.uk','+44 7700 900106',
  '2026-05-19 08:30:00+00', 'confirmed', 'paid', 'pay_at_salon',
  '2026-05-18 10:00:00+00'
),(
  'e5000001-0000-4000-8000-000000000007',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000001',
  'd4000001-0000-4000-8000-000000000002',
  'Hannah Scott','hannah.scott@email.co.uk','+44 7700 900107',
  '2026-05-20 10:00:00+00', 'confirmed', 'paid', 'pay_at_salon',
  '2026-05-19 08:00:00+00'
),(
  'e5000001-0000-4000-8000-000000000008',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000002',
  'd4000001-0000-4000-8000-000000000005',
  'Ella Mitchell','ella.mitchell@email.co.uk','+44 7700 900108',
  '2026-05-21 13:00:00+00', 'confirmed', 'paid', 'pay_at_salon',
  '2026-05-20 11:00:00+00'
),(
  'e5000001-0000-4000-8000-000000000009',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000001',
  'd4000001-0000-4000-8000-000000000003',
  'Poppy Brown','poppy.brown@email.co.uk','+44 7700 900109',
  '2026-05-22 09:00:00+00', 'confirmed', 'paid', 'pay_at_salon',
  '2026-05-21 16:00:00+00'
),(
  'e5000001-0000-4000-8000-000000000010',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000002',
  'd4000001-0000-4000-8000-000000000006',
  'Ruby Taylor','ruby.taylor@email.co.uk','+44 7700 900110',
  '2026-05-23 12:00:00+00', 'confirmed', 'paid', 'pay_at_salon',
  '2026-05-22 09:00:00+00'
),

-- ── Today 25 May — morning (past, mix of completed + confirmed) ──
(
  'e5000001-0000-4000-8000-000000000011',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000001',
  'd4000001-0000-4000-8000-000000000001',
  'Emma Wilson','emma.wilson@email.co.uk','+44 7700 900111',
  '2026-05-25 08:30:00+00', 'completed', 'paid', 'pay_at_salon',
  '2026-05-24 14:00:00+00'
),(
  'e5000001-0000-4000-8000-000000000012',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000002',
  'd4000001-0000-4000-8000-000000000002',
  'Sophie Turner','sophie.turner@email.co.uk','+44 7700 900112',
  '2026-05-25 10:00:00+00', 'confirmed', 'paid', 'pay_at_salon',
  '2026-05-24 11:00:00+00'
),

-- ── Today 25 May — afternoon (upcoming, confirmed) ───────────────
(
  'e5000001-0000-4000-8000-000000000013',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000003',
  'd4000001-0000-4000-8000-000000000004',
  'Liam Harris','liam.harris@email.co.uk','+44 7700 900113',
  '2026-05-25 13:00:00+00', 'confirmed', 'pending', 'pay_at_salon',
  '2026-05-24 15:00:00+00'
),(
  'e5000001-0000-4000-8000-000000000014',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000001',
  'd4000001-0000-4000-8000-000000000003',
  'Chloe Roberts','chloe.roberts@email.co.uk','+44 7700 900114',
  '2026-05-25 14:30:00+00', 'confirmed', 'pending', 'pay_at_salon',
  '2026-05-25 07:00:00+00'
),

-- ── Tue 26 May ───────────────────────────────────────────────────
(
  'e5000001-0000-4000-8000-000000000015',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000002',
  'd4000001-0000-4000-8000-000000000006',
  'Amelia King','amelia.king@email.co.uk','+44 7700 900115',
  '2026-05-26 08:30:00+00', 'confirmed', 'pending', 'pay_at_salon',
  '2026-05-25 08:00:00+00'
),(
  'e5000001-0000-4000-8000-000000000016',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000002',
  'd4000001-0000-4000-8000-000000000005',
  'Zoe Wright','zoe.wright@email.co.uk','+44 7700 900116',
  '2026-05-26 10:00:00+00', 'pending', 'pending', 'pay_at_salon',
  '2026-05-25 09:00:00+00'
),

-- ── Wed 27 May ───────────────────────────────────────────────────
(
  'e5000001-0000-4000-8000-000000000017',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000003',
  'd4000001-0000-4000-8000-000000000001',
  'Oliver Davis','oliver.davis@email.co.uk','+44 7700 900117',
  '2026-05-27 09:00:00+00', 'confirmed', 'pending', 'pay_at_salon',
  '2026-05-25 10:00:00+00'
),(
  'e5000001-0000-4000-8000-000000000018',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000001',
  'd4000001-0000-4000-8000-000000000002',
  'Isla Green','isla.green@email.co.uk','+44 7700 900118',
  '2026-05-27 13:00:00+00', 'confirmed', 'pending', 'pay_at_salon',
  '2026-05-25 11:00:00+00'
),

-- ── Thu 28 May ───────────────────────────────────────────────────
(
  'e5000001-0000-4000-8000-000000000019',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000002',
  'd4000001-0000-4000-8000-000000000005',
  'Freya Adams','freya.adams@email.co.uk','+44 7700 900119',
  '2026-05-28 10:00:00+00', 'pending', 'pending', 'pay_at_salon',
  '2026-05-25 12:00:00+00'
),

-- ── Next week Mon 1 Jun + Tue 2 Jun ──────────────────────────────
(
  'e5000001-0000-4000-8000-000000000020',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000001',
  'd4000001-0000-4000-8000-000000000003',
  'Grace Hall','grace.hall@email.co.uk','+44 7700 900120',
  '2026-06-01 09:00:00+00', 'confirmed', 'pending', 'pay_at_salon',
  '2026-05-25 13:00:00+00'
),(
  'e5000001-0000-4000-8000-000000000021',
  'a2000001-0000-4000-8000-000000000001',
  'c3000001-0000-4000-8000-000000000002',
  'd4000001-0000-4000-8000-000000000002',
  'Ethan Brooks','ethan.brooks@email.co.uk','+44 7700 900121',
  '2026-06-02 13:00:00+00', 'confirmed', 'pending', 'pay_at_salon',
  '2026-05-25 14:00:00+00'
)

ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- WHAT YOU GET
-- ================================================================
-- Salon   : Luxe Hair & Beauty  (plan: Pro · Active)
-- Staff   : Sarah Ahmed · Maria Lopez · James Carter
-- Services: Haircut £25 · Hair Colour £60 · Blow Dry £20
--           Beard Trim £15 · Manicure £30 · Facial £40
--
-- Dashboard stats (live at login):
--   Upcoming       : 9
--   Total Revenue  : £680   (all confirmed appts, past + future)
--   Total Bookings : 21
--   Stylists       : 3
--
-- Booking statuses: confirmed (16) · pending (2) · completed (1 today)
--
-- Payments page:
--   Total Collected : £680  (confirmed)
--   Pending         : £60   (Zoe £30 + Freya £30)
--   Refunded        : £0
--   Transactions    : 21
--
-- Login  : demo.luxe@featuresalon.co.uk
-- Password: PlayStore2026!
-- ================================================================
