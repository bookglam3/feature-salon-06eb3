-- ═══════════════════════════════════════════════════════════════
-- Service categories + gender restriction
-- ═══════════════════════════════════════════════════════════════
-- Run this once in the Supabase SQL editor.
-- Additive/backward-compatible only: no existing column is dropped,
-- renamed, or backfilled. Every existing service keeps working with
-- category_id = NULL, sort_order = 0, gender_restriction = 'all'.

-- ── service_categories ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id   uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name       text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- A business cannot create two categories with the same name
-- (case-insensitive). Expressions aren't allowed in a table-level
-- UNIQUE constraint, so this is a unique index instead.
CREATE UNIQUE INDEX IF NOT EXISTS service_categories_salon_name_uniq
  ON service_categories (salon_id, lower(name));

CREATE INDEX IF NOT EXISTS service_categories_salon_id_idx
  ON service_categories (salon_id);

-- ── services — new columns ──────────────────────────────────────
ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id uuid
  REFERENCES service_categories(id) ON DELETE SET NULL;

ALTER TABLE services ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

ALTER TABLE services ADD COLUMN IF NOT EXISTS gender_restriction text
  NOT NULL DEFAULT 'all';

DO $$
BEGIN
  ALTER TABLE services ADD CONSTRAINT services_gender_restriction_check
    CHECK (gender_restriction IN ('all', 'female', 'male'));
EXCEPTION WHEN duplicate_object THEN
  NULL; -- constraint already exists, safe to re-run
END $$;

CREATE INDEX IF NOT EXISTS services_category_id_idx ON services (category_id);

-- ── RLS on service_categories — mirrors the existing `services`
-- policies exactly (see supabase-services-migration.sql). SELECT is
-- fully public (no auth, no business-active check) because the public
-- booking page reads it unauthenticated, same as it already reads
-- services. INSERT/UPDATE/DELETE are scoped to the owning salon.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_categories_select" ON service_categories;
DROP POLICY IF EXISTS "service_categories_insert" ON service_categories;
DROP POLICY IF EXISTS "service_categories_update" ON service_categories;
DROP POLICY IF EXISTS "service_categories_delete" ON service_categories;

CREATE POLICY "service_categories_select"
  ON service_categories FOR SELECT
  USING (true);

CREATE POLICY "service_categories_insert"
  ON service_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE POLICY "service_categories_update"
  ON service_categories FOR UPDATE
  TO authenticated
  USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE POLICY "service_categories_delete"
  ON service_categories FOR DELETE
  TO authenticated
  USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );
