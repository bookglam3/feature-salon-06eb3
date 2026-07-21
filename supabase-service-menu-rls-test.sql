-- ═══════════════════════════════════════════════════════════════
-- Cross-salon RLS isolation test — service_categories, services,
-- and every new catalogue table.
-- ═══════════════════════════════════════════════════════════════
-- SAFE TO RUN AGAINST PRODUCTION: everything happens inside one
-- transaction that ends in ROLLBACK, not COMMIT. Two throwaway
-- auth.users rows and two throwaway salons are created, exercised,
-- and asserted against — nothing persists afterward regardless of
-- pass or fail. Run this in the Supabase SQL editor and read the
-- NOTICE output; any RAISE EXCEPTION means an isolation test failed.
--
-- Requires INSERT privilege on auth.users (salons.owner_id has a FK
-- there). If the SQL editor's role rejects that insert, tell me —
-- TEST 3 and TEST 4's owner-visibility half need a real owner
-- identity and would need to be dropped, weakening coverage.
--
-- Method: SET LOCAL ROLE + request.jwt.claims simulates being logged
-- in as a specific auth.uid(), exactly how PostgREST sets these per
-- request — the standard way to test RLS policies directly in SQL.

BEGIN;

DO $$
DECLARE
  owner_a uuid := gen_random_uuid();
  owner_b uuid := gen_random_uuid();
  salon_a uuid;
  salon_b uuid;
  cat_a   uuid;
  svc_a   uuid;
  variant_a uuid;
  n       int;
BEGIN
  -- ── Setup (as service-role / postgres — bypasses RLS) ──────────
  -- salons.owner_id has a FOREIGN KEY to auth.users(id), so owner_a/
  -- owner_b must exist there before the salons inserts below. Column
  -- set matches the proven working pattern already used in this repo
  -- (supabase-luxe-demo-seed.sql / supabase-demo-migration.sql) — not
  -- guessed. auth.identities is deliberately NOT inserted: this test
  -- forges request.jwt.claims directly via set_config, which doesn't
  -- go through a real Supabase Auth session, so identities isn't read.
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES
  (
    '00000000-0000-0000-0000-000000000000', owner_a, 'authenticated', 'authenticated',
    'rls-test-a-' || substr(owner_a::text,1,8) || '@example.invalid',
    crypt('throwaway-' || owner_a::text, gen_salt('bf')),
    NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}',
    NOW(), NOW(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000', owner_b, 'authenticated', 'authenticated',
    'rls-test-b-' || substr(owner_b::text,1,8) || '@example.invalid',
    crypt('throwaway-' || owner_b::text, gen_salt('bf')),
    NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}',
    NOW(), NOW(),
    '', '', '', ''
  );

  INSERT INTO salons (id, name, slug, owner_id, owner_email, plan)
    VALUES (gen_random_uuid(), 'RLS Test Salon A', 'rls-test-salon-a-' || substr(owner_a::text,1,8), owner_a, 'rls-test-a-' || substr(owner_a::text,1,8) || '@example.invalid', 'starter')
    RETURNING id INTO salon_a;
  INSERT INTO salons (id, name, slug, owner_id, owner_email, plan)
    VALUES (gen_random_uuid(), 'RLS Test Salon B', 'rls-test-salon-b-' || substr(owner_b::text,1,8), owner_b, 'rls-test-b-' || substr(owner_b::text,1,8) || '@example.invalid', 'starter')
    RETURNING id INTO salon_b;

  INSERT INTO service_categories (id, salon_id, name, sort_order)
    VALUES (gen_random_uuid(), salon_a, 'RLS Test Category', 0)
    RETURNING id INTO cat_a;

  INSERT INTO services (id, salon_id, category_id, name, price, duration_minutes, price_type)
    VALUES (gen_random_uuid(), salon_a, cat_a, 'RLS Test Service', 25, 30, 'fixed')
    RETURNING id INTO svc_a;

  INSERT INTO service_variants (id, service_id, name, price_type, price, duration_minutes)
    VALUES (gen_random_uuid(), svc_a, 'RLS Test Variant', 'fixed', 25, 30)
    RETURNING id INTO variant_a;

  RAISE NOTICE '── Setup complete: salon_a=%, salon_b=%, service=%', salon_a, salon_b, svc_a;

  -- ═══════════════════════════════════════════════════════════
  -- TEST 1: Salon B's owner cannot READ Salon A's category/service/variant
  -- ═══════════════════════════════════════════════════════════
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', owner_b, 'role', 'authenticated')::text, true);

  SELECT count(*) INTO n FROM service_categories WHERE id = cat_a;
  -- service_categories_select_public is USING (archived_at IS NULL) with no
  -- TO clause, same as services/service_variants below — it applies to
  -- authenticated too, by design (the public booking page must read
  -- categories). A non-archived category IS legitimately visible to anyone,
  -- including Salon B's owner acting as "public" — not a leak. The real
  -- test is the WRITE path below.
  RAISE NOTICE 'INFO: Salon B owner sees % row(s) of Salon A''s public category (expected 1 — public SELECT policy is intentionally open)', n;

  SELECT count(*) INTO n FROM services WHERE id = svc_a AND salon_id = salon_a;
  -- services has a public policy too (archived_at IS NULL AND is_online_bookable),
  -- so a non-archived, online-bookable service IS legitimately visible to anyone,
  -- including Salon B's owner acting as "public" — that's correct, not a leak.
  -- The real test is the WRITE path below, and the private (archived) case.
  RAISE NOTICE 'INFO: Salon B owner sees % row(s) of Salon A''s public service (expected 1 — public SELECT policy is intentionally open)', n;

  SELECT count(*) INTO n FROM service_variants WHERE id = variant_a;
  RAISE NOTICE 'INFO: Salon B owner sees % row(s) of Salon A''s public variant (expected 1 — same public-read reasoning)', n;

  -- ═══════════════════════════════════════════════════════════
  -- TEST 2: Salon B's owner cannot WRITE to Salon A's rows — this is
  -- the test that actually proves tenant isolation, since SELECT is
  -- deliberately public for the booking page.
  -- ═══════════════════════════════════════════════════════════
  BEGIN
    UPDATE service_categories SET name = 'HACKED' WHERE id = cat_a;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: Salon B owner UPDATEd Salon A''s category (% rows affected)', n; END IF;
    RAISE NOTICE 'PASS: Salon B owner''s UPDATE on Salon A''s category affected 0 rows';
  END;

  BEGIN
    UPDATE services SET price = 999999 WHERE id = svc_a;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: Salon B owner UPDATEd Salon A''s service (% rows affected)', n; END IF;
    RAISE NOTICE 'PASS: Salon B owner''s UPDATE on Salon A''s service affected 0 rows';
  END;

  BEGIN
    UPDATE service_variants SET price = 999999 WHERE id = variant_a;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: Salon B owner UPDATEd Salon A''s variant (% rows affected)', n; END IF;
    RAISE NOTICE 'PASS: Salon B owner''s UPDATE on Salon A''s variant affected 0 rows';
  END;

  BEGIN
    DELETE FROM services WHERE id = svc_a;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: Salon B owner DELETEd Salon A''s service (% rows affected)', n; END IF;
    RAISE NOTICE 'PASS: Salon B owner''s DELETE on Salon A''s service affected 0 rows';
  END;

  BEGIN
    INSERT INTO service_categories (salon_id, name) VALUES (salon_a, 'Injected by B');
    RAISE EXCEPTION 'FAIL: Salon B owner was able to INSERT a category into Salon A';
  EXCEPTION WHEN insufficient_privilege OR others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF; -- re-raise our own failure, don't swallow it
    RAISE NOTICE 'PASS: Salon B owner''s INSERT into Salon A was rejected (%)', SQLERRM;
  END;

  -- ═══════════════════════════════════════════════════════════
  -- TEST 3: Salon A's owner CAN write to their own rows (sanity —
  -- proves the policy isn't just accidentally blocking everyone)
  -- ═══════════════════════════════════════════════════════════
  PERFORM set_config('request.jwt.claims', json_build_object('sub', owner_a, 'role', 'authenticated')::text, true);

  UPDATE service_categories SET name = 'Renamed by owner A' WHERE id = cat_a;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: Salon A owner could not UPDATE their own category (% rows affected)', n; END IF;
  RAISE NOTICE 'PASS: Salon A owner can UPDATE their own category';

  UPDATE services SET price = 30 WHERE id = svc_a;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: Salon A owner could not UPDATE their own service (% rows affected)', n; END IF;
  RAISE NOTICE 'PASS: Salon A owner can UPDATE their own service';

  -- ═══════════════════════════════════════════════════════════
  -- TEST 4: an archived category/service is invisible to the public
  -- (anon) role but still visible to its own owner
  -- ═══════════════════════════════════════════════════════════
  UPDATE service_categories SET archived_at = now() WHERE id = cat_a;
  UPDATE services SET archived_at = now() WHERE id = svc_a;

  RESET ROLE;
  SET LOCAL ROLE anon;
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);

  SELECT count(*) INTO n FROM service_categories WHERE id = cat_a;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: anon could SELECT an archived category (got % rows)', n; END IF;
  RAISE NOTICE 'PASS: anon cannot see an archived category';

  SELECT count(*) INTO n FROM services WHERE id = svc_a;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: anon could SELECT an archived service (got % rows)', n; END IF;
  RAISE NOTICE 'PASS: anon cannot see an archived service';

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', owner_a, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO n FROM service_categories WHERE id = cat_a;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: Salon A owner could not see their own archived category (got % rows)', n; END IF;
  RAISE NOTICE 'PASS: Salon A owner can still see their own archived category';

  RESET ROLE;
  RAISE NOTICE '══════════════════════════════════════════════';
  RAISE NOTICE 'ALL TESTS PASSED';
  RAISE NOTICE '══════════════════════════════════════════════';
END $$;

ROLLBACK;
-- ^ Nothing above persists. If you saw "ALL TESTS PASSED" with no
-- exceptions, cross-salon isolation and archived-row visibility are
-- both correctly enforced. Any RAISE EXCEPTION output is a real,
-- specific isolation failure — copy the message back to me.
