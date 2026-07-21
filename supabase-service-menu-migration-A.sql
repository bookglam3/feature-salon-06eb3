-- ═══════════════════════════════════════════════════════════════
-- Service Menu — Migration A (additive, reversible)
-- ═══════════════════════════════════════════════════════════════
-- Safe to run NOW, before the app-code changes deploy. price_is_from
-- stays a plain writable boolean throughout this file — untouched.
-- Do NOT run supabase-service-menu-migration-B.sql until the app
-- changes (ServiceModal.tsx / api/services/route.ts writing
-- price_type instead of price_is_from) are committed, pushed, and
-- deployed to production. B converts price_is_from into a generated
-- column; any code still writing to it directly will start throwing
-- the moment B lands.
--
-- Rollback: supabase-service-menu-rollback-A.sql (schema only — see
-- that file's header for why the category_id backfill isn't
-- auto-reversed).
--
-- NAMING NOTE: this repo's existing column is `sort_order`, not
-- `position` — used throughout below, including on brand-new tables,
-- for one consistent name across the whole catalogue rather than two
-- names for the same concept in one schema. Same reasoning applied to
-- `duration_minutes` (existing, used everywhere in this codebase)
-- instead of introducing a second name `duration_min` on the new
-- per-variant/per-staff tables.
--
-- Whole file runs as one transaction — a failure partway through
-- (e.g. an unexpected existing policy name) rolls back cleanly
-- instead of leaving the schema half-migrated.

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- 1. services — price_type added, backfilled from the EXISTING
--    price_is_from boolean (read-only reference here — the column
--    itself is not touched, not dropped, not converted in this file).
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS price_type text NOT NULL DEFAULT 'fixed'
    CHECK (price_type IN ('fixed','from','free'));

UPDATE services SET price_type =
  CASE WHEN price_is_from THEN 'from' ELSE 'fixed' END;

DO $$
BEGIN
  ALTER TABLE services
    ADD CONSTRAINT services_price_matches_type
      CHECK ((price_type = 'free' AND price = 0) OR price_type <> 'free');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 2. services — remaining Phase 1 catalogue columns
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE services ADD COLUMN IF NOT EXISTS processing_time_min int NOT NULL DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS blocked_time_min    int NOT NULL DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_online_bookable  boolean NOT NULL DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS tax_rate_override   numeric(5,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS archived_at         timestamptz;
ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at          timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  ALTER TABLE services ADD CONSTRAINT services_price_nonneg CHECK (price >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE services ADD CONSTRAINT services_duration_positive CHECK (duration_minutes > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE services ADD CONSTRAINT services_processing_time_nonneg CHECK (processing_time_min >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE services ADD CONSTRAINT services_blocked_time_nonneg CHECK (blocked_time_min >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 3. services.category — deprecated, not dropped. category_id backfill.
-- ═══════════════════════════════════════════════════════════════
-- One-time backfill: for every service that has a legacy free-text
-- category but no category_id, create (or reuse) a matching
-- service_categories row for that salon and link it.
INSERT INTO service_categories (salon_id, name, sort_order)
SELECT DISTINCT s.salon_id, s.category, 0
FROM services s
WHERE s.category_id IS NULL
  AND s.category IS NOT NULL AND s.category <> ''
  AND NOT EXISTS (
    SELECT 1 FROM service_categories sc
    WHERE sc.salon_id = s.salon_id AND lower(sc.name) = lower(s.category)
  );

UPDATE services s
SET category_id = sc.id
FROM service_categories sc
WHERE s.category_id IS NULL
  AND s.category IS NOT NULL AND s.category <> ''
  AND sc.salon_id = s.salon_id
  AND lower(sc.name) = lower(s.category);

COMMENT ON COLUMN services.category IS
  'DEPRECATED — superseded by category_id. Do not write to this column. '
  'Kept for historical/audit purposes only; not dropped this task. '
  'app/api/services/route.ts POST/PATCH no longer accepts or writes this '
  'field (fixed prior to this migration) — category_id is the only writer.';

-- ═══════════════════════════════════════════════════════════════
-- 4. service_categories — add archived_at + updated_at to match services
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();

-- ═══════════════════════════════════════════════════════════════
-- 5. Shared updated_at trigger — no such helper existed anywhere in
--    this codebase's migrations before now, so this is new.
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_services_updated_at ON services;
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_service_categories_updated_at ON service_categories;
CREATE TRIGGER trg_service_categories_updated_at
  BEFORE UPDATE ON service_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- 6. New catalogue tables (Phase 2+ UI — schema only, built now so it
--    doesn't block Step 2, but nothing reads/writes these yet)
-- ═══════════════════════════════════════════════════════════════

-- "Short hair £45/45m" vs "Long hair £65/75m"
CREATE TABLE IF NOT EXISTS service_variants (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id        uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name              text NOT NULL,
  description       text,
  price_type        text NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed','from','free')),
  price             numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  duration_minutes  int NOT NULL CHECK (duration_minutes > 0),
  sort_order        int NOT NULL DEFAULT 0,
  archived_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (price_type <> 'free' OR price = 0)
);

-- The stylist-tier matrix: Junior £35 / Senior £55, same service
CREATE TABLE IF NOT EXISTS service_staff_pricing (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id        uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  staff_id          uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  price_type        text NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed','from','free')),
  price             numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  duration_minutes  int CHECK (duration_minutes IS NULL OR duration_minutes > 0), -- null = inherit from service
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id, staff_id),
  CHECK (price_type <> 'free' OR price = 0)
);

-- Group has a client-facing prompt: "Choose your conditioner"
CREATE TABLE IF NOT EXISTS addon_groups (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id     uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name           text NOT NULL,
  client_prompt  text,
  sort_order     int NOT NULL DEFAULT 0,
  archived_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS addons (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id             uuid NOT NULL REFERENCES addon_groups(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  description          text,
  extra_price          numeric(10,2) NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
  extra_duration_min   int NOT NULL DEFAULT 0 CHECK (extra_duration_min >= 0),
  sort_order           int NOT NULL DEFAULT 0,
  archived_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- 2+ services sold together
CREATE TABLE IF NOT EXISTS bundles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id      uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  category_id   uuid REFERENCES service_categories(id) ON DELETE SET NULL,
  name          text NOT NULL,
  description   text,
  price_type    text NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed','from','free')),
  price         numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  booking_mode  text NOT NULL DEFAULT 'sequence' CHECK (booking_mode IN ('sequence','parallel')),
  sort_order    int NOT NULL DEFAULT 0,
  archived_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (price_type <> 'free' OR price = 0)
);

CREATE TABLE IF NOT EXISTS bundle_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id        uuid NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  service_id       uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  sort_order       int NOT NULL DEFAULT 0,
  extra_time_type  text CHECK (extra_time_type IS NULL OR extra_time_type IN ('processing','blocked')),
  extra_time_min   int CHECK (extra_time_min IS NULL OR extra_time_min >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Optional limits, e.g. bridal trials Tuesdays only
CREATE TABLE IF NOT EXISTS service_availability (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id    uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  day_of_week   int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    time NOT NULL,
  end_time      time NOT NULL,
  valid_from    date,
  valid_to      date,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

-- Who can perform what
CREATE TABLE IF NOT EXISTS service_staff (
  service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  staff_id    uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, staff_id)
);

-- updated_at triggers for the new tables that have the column
DROP TRIGGER IF EXISTS trg_service_variants_updated_at ON service_variants;
CREATE TRIGGER trg_service_variants_updated_at BEFORE UPDATE ON service_variants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_service_staff_pricing_updated_at ON service_staff_pricing;
CREATE TRIGGER trg_service_staff_pricing_updated_at BEFORE UPDATE ON service_staff_pricing FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_addon_groups_updated_at ON addon_groups;
CREATE TRIGGER trg_addon_groups_updated_at BEFORE UPDATE ON addon_groups FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_addons_updated_at ON addons;
CREATE TRIGGER trg_addons_updated_at BEFORE UPDATE ON addons FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_bundles_updated_at ON bundles;
CREATE TRIGGER trg_bundles_updated_at BEFORE UPDATE ON bundles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_bundle_items_updated_at ON bundle_items;
CREATE TRIGGER trg_bundle_items_updated_at BEFORE UPDATE ON bundle_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_service_availability_updated_at ON service_availability;
CREATE TRIGGER trg_service_availability_updated_at BEFORE UPDATE ON service_availability FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- 7. Indexes
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS services_salon_sort_idx
  ON services (salon_id, sort_order) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS service_categories_salon_sort_idx
  ON service_categories (salon_id, sort_order) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS service_variants_service_sort_idx
  ON service_variants (service_id, sort_order) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS addon_groups_service_sort_idx
  ON addon_groups (service_id, sort_order) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS addons_group_sort_idx
  ON addons (group_id, sort_order) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS bundles_salon_sort_idx
  ON bundles (salon_id, sort_order) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS bundle_items_bundle_sort_idx
  ON bundle_items (bundle_id, sort_order);

-- FK indexes — Postgres doesn't add these automatically, and the RLS
-- policies below join through every one of them on every query.
CREATE INDEX IF NOT EXISTS service_staff_pricing_service_idx ON service_staff_pricing (service_id);
CREATE INDEX IF NOT EXISTS service_staff_pricing_staff_idx   ON service_staff_pricing (staff_id);
CREATE INDEX IF NOT EXISTS addons_group_idx                  ON addons (group_id);
CREATE INDEX IF NOT EXISTS bundle_items_bundle_idx            ON bundle_items (bundle_id);
CREATE INDEX IF NOT EXISTS bundle_items_service_idx           ON bundle_items (service_id);
CREATE INDEX IF NOT EXISTS service_availability_service_idx   ON service_availability (service_id);
CREATE INDEX IF NOT EXISTS service_staff_staff_idx             ON service_staff (staff_id);
CREATE INDEX IF NOT EXISTS bundles_category_idx                ON bundles (category_id);

-- ═══════════════════════════════════════════════════════════════
-- 7.5. Drop pre-existing loose/permissive policies on services
-- ═══════════════════════════════════════════════════════════════
-- Found via a live pg_policies audit (not present in any tracked
-- migration file — created directly against the database outside
-- this repo's history). Permissive policies OR together, so these
-- eight made services_insert/update/delete dead letters (any
-- authenticated user could write to any salon's services) and made
-- the archived_at/is_online_bookable filtering below on
-- services_select_public meaningless (four other SELECT policies
-- returned true unconditionally). Same class of hole as
-- appointments/payments — see that memory entry.
DROP POLICY IF EXISTS "Allow authenticated insert" ON services;
DROP POLICY IF EXISTS "Allow authenticated update" ON services;
DROP POLICY IF EXISTS "Allow authenticated delete" ON services;
DROP POLICY IF EXISTS "Allow authenticated select" ON services;
DROP POLICY IF EXISTS "Allow public read services"  ON services;
DROP POLICY IF EXISTS "Public can read services"     ON services;
DROP POLICY IF EXISTS "anon_select_services"         ON services;
DROP POLICY IF EXISTS "services_select"              ON services;

-- ═══════════════════════════════════════════════════════════════
-- 8. RLS
-- ═══════════════════════════════════════════════════════════════
-- Pattern used throughout (per your resolution #3 — the proven
-- service_categories/clients pattern, NOT the appointments/payments
-- USING(true) pattern):
--   - Public (no `TO` clause => applies to anon AND authenticated):
--     SELECT rows where archived_at IS NULL (and, for services
--     directly, is_online_bookable). This must apply to `authenticated`
--     too, not just `anon` — a logged-in salon owner browsing a
--     DIFFERENT salon's public booking page sends requests as
--     `authenticated` (the browser's Supabase client always attaches
--     the current session's JWT), not `anon`. A policy scoped only to
--     "authenticated + owns this salon" would silently break the
--     public booking page for anyone who happens to be logged in.
--   - Owner (`TO authenticated`, salon-scoped via auth.uid()): full
--     access — SELECT (including archived rows), INSERT, UPDATE,
--     DELETE — to their own salon's rows only. RLS SELECT policies OR
--     together, so an owner gets the public rows AND their own
--     archived rows as the union of both policies.
--   - Child tables (no direct salon_id) resolve ownership by walking
--     the same FK chain the app already uses for scoping.

-- ── services ─────────────────────────────────────────────────
-- (services_select already dropped in section 7.5 above)
CREATE POLICY "services_select_public" ON services
  FOR SELECT
  USING (archived_at IS NULL AND is_online_bookable);
CREATE POLICY "services_select_owner" ON services
  FOR SELECT TO authenticated
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
-- services_insert / services_update / services_delete already use the
-- correct salon-scoped pattern (supabase-services-migration.sql) — untouched.

-- ── service_categories ──────────────────────────────────────
DROP POLICY IF EXISTS "service_categories_select" ON service_categories;
CREATE POLICY "service_categories_select_public" ON service_categories
  FOR SELECT
  USING (archived_at IS NULL);
CREATE POLICY "service_categories_select_owner" ON service_categories
  FOR SELECT TO authenticated
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
-- insert/update/delete already salon-scoped (supabase-service-categories-migration.sql) — untouched.

-- ── service_variants ─────────────────────────────────────────
ALTER TABLE service_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_variants_select_public" ON service_variants
  FOR SELECT
  USING (
    archived_at IS NULL
    AND EXISTS (SELECT 1 FROM services s WHERE s.id = service_variants.service_id AND s.archived_at IS NULL AND s.is_online_bookable)
  );
CREATE POLICY "service_variants_owner_all" ON service_variants
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM services s JOIN salons sa ON sa.id = s.salon_id WHERE s.id = service_variants.service_id AND sa.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM services s JOIN salons sa ON sa.id = s.salon_id WHERE s.id = service_variants.service_id AND sa.owner_id = auth.uid())
  );

-- ── service_staff_pricing ────────────────────────────────────
ALTER TABLE service_staff_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_staff_pricing_select_public" ON service_staff_pricing
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM services s WHERE s.id = service_staff_pricing.service_id AND s.archived_at IS NULL AND s.is_online_bookable)
  );
CREATE POLICY "service_staff_pricing_owner_all" ON service_staff_pricing
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM services s JOIN salons sa ON sa.id = s.salon_id WHERE s.id = service_staff_pricing.service_id AND sa.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM services s JOIN salons sa ON sa.id = s.salon_id WHERE s.id = service_staff_pricing.service_id AND sa.owner_id = auth.uid())
  );

-- ── addon_groups ──────────────────────────────────────────────
ALTER TABLE addon_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addon_groups_select_public" ON addon_groups
  FOR SELECT
  USING (
    archived_at IS NULL
    AND EXISTS (SELECT 1 FROM services s WHERE s.id = addon_groups.service_id AND s.archived_at IS NULL AND s.is_online_bookable)
  );
CREATE POLICY "addon_groups_owner_all" ON addon_groups
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM services s JOIN salons sa ON sa.id = s.salon_id WHERE s.id = addon_groups.service_id AND sa.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM services s JOIN salons sa ON sa.id = s.salon_id WHERE s.id = addon_groups.service_id AND sa.owner_id = auth.uid())
  );

-- ── addons ────────────────────────────────────────────────────
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addons_select_public" ON addons
  FOR SELECT
  USING (
    archived_at IS NULL
    AND EXISTS (
      SELECT 1 FROM addon_groups g JOIN services s ON s.id = g.service_id
      WHERE g.id = addons.group_id AND g.archived_at IS NULL AND s.archived_at IS NULL AND s.is_online_bookable
    )
  );
CREATE POLICY "addons_owner_all" ON addons
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM addon_groups g JOIN services s ON s.id = g.service_id JOIN salons sa ON sa.id = s.salon_id
      WHERE g.id = addons.group_id AND sa.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM addon_groups g JOIN services s ON s.id = g.service_id JOIN salons sa ON sa.id = s.salon_id
      WHERE g.id = addons.group_id AND sa.owner_id = auth.uid()
    )
  );

-- ── bundles ───────────────────────────────────────────────────
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bundles_select_public" ON bundles
  FOR SELECT
  USING (archived_at IS NULL);
CREATE POLICY "bundles_owner_all" ON bundles
  FOR ALL TO authenticated
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- ── bundle_items ──────────────────────────────────────────────
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bundle_items_select_public" ON bundle_items
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM bundles b WHERE b.id = bundle_items.bundle_id AND b.archived_at IS NULL)
  );
CREATE POLICY "bundle_items_owner_all" ON bundle_items
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM bundles b JOIN salons sa ON sa.id = b.salon_id WHERE b.id = bundle_items.bundle_id AND sa.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM bundles b JOIN salons sa ON sa.id = b.salon_id WHERE b.id = bundle_items.bundle_id AND sa.owner_id = auth.uid())
  );

-- ── service_availability ─────────────────────────────────────
ALTER TABLE service_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_availability_select_public" ON service_availability
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM services s WHERE s.id = service_availability.service_id AND s.archived_at IS NULL AND s.is_online_bookable)
  );
CREATE POLICY "service_availability_owner_all" ON service_availability
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM services s JOIN salons sa ON sa.id = s.salon_id WHERE s.id = service_availability.service_id AND sa.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM services s JOIN salons sa ON sa.id = s.salon_id WHERE s.id = service_availability.service_id AND sa.owner_id = auth.uid())
  );

-- ── service_staff ─────────────────────────────────────────────
ALTER TABLE service_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_staff_select_public" ON service_staff
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM services s WHERE s.id = service_staff.service_id AND s.archived_at IS NULL AND s.is_online_bookable)
  );
CREATE POLICY "service_staff_owner_all" ON service_staff
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM services s JOIN salons sa ON sa.id = s.salon_id WHERE s.id = service_staff.service_id AND sa.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM services s JOIN salons sa ON sa.id = s.salon_id WHERE s.id = service_staff.service_id AND sa.owner_id = auth.uid())
  );

COMMIT;
