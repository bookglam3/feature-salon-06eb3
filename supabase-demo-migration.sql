-- ================================================================
-- Feature Salon — Demo Account System Migration
-- Run once in Supabase SQL Editor
-- ================================================================

-- ── 1. Add 'guest' to admin_role enum ────────────────────────
ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'guest';

-- ── 2. Demo control columns on admin_users ───────────────────
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS demo_expires_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS demo_enabled     BOOLEAN NOT NULL DEFAULT true;

-- ── 3. Mark demo rows in salons ──────────────────────────────
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN NOT NULL DEFAULT false;

-- ── 4. Mark demo rows in login_logs ─────────────────────────
ALTER TABLE login_logs
  ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN NOT NULL DEFAULT false;

-- ── 5. Index ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_salons_demo ON salons(is_demo_data);

-- ── 6. Create Supabase Auth user for demo guest ───────────────
-- Email   : hushhushkarl@gmail.com
-- Password: DemoGuest2026!
-- UUID    : c8d9e0f1-a2b3-4c4d-85e6-f7a8b9c0d1e2
--
-- If this INSERT fails due to schema differences, instead:
--   Dashboard → Authentication → Users → Add User → enter email/password
--   Then copy the UUID and update the admin_users INSERT below.

INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'c8d9e0f1-a2b3-4c4d-85e6-f7a8b9c0d1e2',
  'authenticated', 'authenticated',
  'hushhushkarl@gmail.com',
  crypt('DemoGuest2026!', gen_salt('bf')),
  NOW(), NOW(),
  '{"provider":"email","providers":["email"]}', '{}',
  NOW(), NOW(),
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) VALUES (
  'hushhushkarl@gmail.com',
  'c8d9e0f1-a2b3-4c4d-85e6-f7a8b9c0d1e2',
  '{"sub":"c8d9e0f1-a2b3-4c4d-85e6-f7a8b9c0d1e2","email":"hushhushkarl@gmail.com","email_verified":true}',
  'email',
  NOW(), NOW(), NOW()
) ON CONFLICT (provider_id, provider) DO NOTHING;

-- ── 7. Admin user record for demo guest ──────────────────────
INSERT INTO admin_users (
  id, email, full_name, role, is_active,
  totp_enabled, demo_enabled, demo_expires_at
) VALUES (
  'c8d9e0f1-a2b3-4c4d-85e6-f7a8b9c0d1e2',
  'hushhushkarl@gmail.com',
  'Demo Guest',
  'guest',
  true,
  false,   -- no 2FA for demo user
  true,
  NOW() + INTERVAL '30 days'
) ON CONFLICT (id) DO UPDATE SET
  role            = 'guest',
  is_active       = true,
  totp_enabled    = false,
  demo_enabled    = true,
  demo_expires_at = GREATEST(admin_users.demo_expires_at, NOW() + INTERVAL '30 days');

-- ── 8. Fake UK salon seed data ────────────────────────────────
INSERT INTO salons (
  id, name, slug, owner_id, owner_email,
  plan, subscription_status, subscription_plan,
  trial_ends_at, created_at, is_demo_data
) VALUES
(
  'a1000000-0000-4000-8000-000000000001',
  'Glam & Go', 'glam-and-go',
  'c8d9e0f1-a2b3-4c4d-85e6-f7a8b9c0d1e2',
  'sophia@glamandgo.co.uk',
  'pro', 'active', 'pro',
  NULL, NOW() - INTERVAL '14 months', true
),(
  'a1000000-0000-4000-8000-000000000002',
  'Snip & Style', 'snip-and-style',
  'c8d9e0f1-a2b3-4c4d-85e6-f7a8b9c0d1e2',
  'liam@snipandstyle.co.uk',
  'starter', 'active', 'starter',
  NULL, NOW() - INTERVAL '8 months', true
),(
  'a1000000-0000-4000-8000-000000000003',
  'The Beauty Bar', 'the-beauty-bar',
  'c8d9e0f1-a2b3-4c4d-85e6-f7a8b9c0d1e2',
  'isabella@thebeautybar.co.uk',
  'pro', 'active', 'pro',
  NULL, NOW() - INTERVAL '11 months', true
),(
  'a1000000-0000-4000-8000-000000000004',
  'Curl Up & Dye', 'curl-up-and-dye',
  'c8d9e0f1-a2b3-4c4d-85e6-f7a8b9c0d1e2',
  'emily@curlupdye.co.uk',
  'starter', 'trialing', 'starter',
  NOW() + INTERVAL '12 days', NOW() - INTERVAL '3 weeks', true
),(
  'a1000000-0000-4000-8000-000000000005',
  'Shear Perfection', 'shear-perfection',
  'c8d9e0f1-a2b3-4c4d-85e6-f7a8b9c0d1e2',
  'james@shearperfection.co.uk',
  'premium', 'active', 'premium',
  NULL, NOW() - INTERVAL '18 months', true
),(
  'a1000000-0000-4000-8000-000000000006',
  'Bliss Beauty Studio', 'bliss-beauty-studio',
  'c8d9e0f1-a2b3-4c4d-85e6-f7a8b9c0d1e2',
  'amelia@blissbeauty.co.uk',
  'starter', 'cancelled', 'starter',
  NULL, NOW() - INTERVAL '6 months', true
)
ON CONFLICT (id) DO NOTHING;

-- ── 9. Fake login logs for demo salons ───────────────────────
INSERT INTO login_logs (
  salon_id, ip_address, city, country, country_code, device, logged_at, is_demo_data
) VALUES
('a1000000-0000-4000-8000-000000000001','86.130.12.45',  'London',     'United Kingdom','GB','Chrome · Windows',  NOW() - INTERVAL '2 hours',    true),
('a1000000-0000-4000-8000-000000000001','86.130.12.45',  'London',     'United Kingdom','GB','Chrome · Windows',  NOW() - INTERVAL '1 day',      true),
('a1000000-0000-4000-8000-000000000002','212.159.43.22', 'Manchester', 'United Kingdom','GB','Safari · iPhone',   NOW() - INTERVAL '4 hours',    true),
('a1000000-0000-4000-8000-000000000003','90.195.67.15',  'Birmingham', 'United Kingdom','GB','Chrome · Mac',      NOW() - INTERVAL '6 hours',    true),
('a1000000-0000-4000-8000-000000000004','109.158.234.56','Leeds',      'United Kingdom','GB','Chrome · Android',  NOW() - INTERVAL '2 days',     true),
('a1000000-0000-4000-8000-000000000005','77.68.97.24',   'Edinburgh',  'United Kingdom','GB','Firefox · Windows', NOW() - INTERVAL '30 minutes', true),
('a1000000-0000-4000-8000-000000000006','93.184.216.11', 'Bristol',    'United Kingdom','GB','Chrome · Windows',  NOW() - INTERVAL '3 days',     true)
ON CONFLICT DO NOTHING;

-- ================================================================
-- Summary:
--   Demo user  : hushhushkarl@gmail.com / DemoGuest2026!
--   UUID       : c8d9e0f1-a2b3-4c4d-85e6-f7a8b9c0d1e2
--   Demo salons: 6 UK salons (is_demo_data = true)
-- ================================================================
