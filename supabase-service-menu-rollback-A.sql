-- ═══════════════════════════════════════════════════════════════
-- Service Menu — Rollback for Migration A
-- ═══════════════════════════════════════════════════════════════
-- Reverses every SCHEMA change made by
-- supabase-service-menu-migration-A.sql: the 8 new tables, their RLS
-- policies/triggers/indexes, the services/service_categories RLS
-- policy split, the new columns, and the shared trigger function.
--
-- Only run this if Migration A has NOT yet been followed by Migration
-- B. If B has already run (price_is_from is a generated column), run
-- in reverse: undo B by hand first (drop the generated column, add
-- back a plain boolean, backfill it from price_type), THEN run this.
-- This script assumes price_is_from is still the plain boolean A left
-- it as.
--
-- ─────────────────────────────────────────────────────────────
-- WHAT THIS DOES NOT REVERSE, AND WHY
-- ─────────────────────────────────────────────────────────────
-- Migration A's category_id backfill is a DATA change, not a schema
-- change: it created new service_categories rows (for any legacy
-- `category` text that had no matching category_id) and pointed
-- previously-NULL services.category_id at them. This script does NOT
-- undo that.
--
-- Reversing it safely would require knowing exactly which
-- service_categories rows were created BY the backfill (versus
-- already existing, or created by a real owner afterward) and exactly
-- which services.category_id values were NULL before the backfill
-- touched them — neither is logged anywhere. A blind "delete anything
-- that looks backfilled" pass risks deleting a category an owner has
-- since renamed, reordered, or assigned more services to. Given this
-- feature's own stated principle — archive, never delete, because a
-- service referenced by past appointments must not disappear — I'm
-- not willing to write an automated DELETE against category data on a
-- guess. If you need this specific backfill undone, tell me the
-- salon(s) involved and I'll write a targeted, reviewed script against
-- the actual current state, not a blind rollback.

-- ── 1. Drop the 8 new tables (CASCADE removes their own RLS
--      policies, triggers, and indexes as dependent objects) ──
DROP TABLE IF EXISTS bundle_items CASCADE;
DROP TABLE IF EXISTS bundles CASCADE;
DROP TABLE IF EXISTS addons CASCADE;
DROP TABLE IF EXISTS addon_groups CASCADE;
DROP TABLE IF EXISTS service_staff_pricing CASCADE;
DROP TABLE IF EXISTS service_staff CASCADE;
DROP TABLE IF EXISTS service_availability CASCADE;
DROP TABLE IF EXISTS service_variants CASCADE;

-- ── 2. Revert services / service_categories SELECT policies back
--      to their original single USING(true) policy ──
DROP POLICY IF EXISTS "services_select_public" ON services;
DROP POLICY IF EXISTS "services_select_owner"  ON services;
CREATE POLICY "services_select" ON services FOR SELECT USING (true);

DROP POLICY IF EXISTS "service_categories_select_public" ON service_categories;
DROP POLICY IF EXISTS "service_categories_select_owner"  ON service_categories;
CREATE POLICY "service_categories_select" ON service_categories FOR SELECT USING (true);

-- ── 3. Drop the indexes A added on services / service_categories
--      (indexes on the 8 dropped tables already went with them) ──
DROP INDEX IF EXISTS services_salon_sort_idx;
DROP INDEX IF EXISTS service_categories_salon_sort_idx;

-- ── 4. Drop the updated_at triggers on services / service_categories,
--      then the shared trigger function (safe now — nothing left
--      references it, since the 8 new tables and their triggers are
--      already gone) ──
DROP TRIGGER IF EXISTS trg_services_updated_at ON services;
DROP TRIGGER IF EXISTS trg_service_categories_updated_at ON service_categories;
DROP FUNCTION IF EXISTS set_updated_at();

-- ── 5. Drop service_categories' new columns ──
ALTER TABLE service_categories DROP COLUMN IF EXISTS archived_at;
ALTER TABLE service_categories DROP COLUMN IF EXISTS updated_at;

-- ── 6. Clear the deprecation comment on services.category ──
COMMENT ON COLUMN services.category IS NULL;

-- ── 7. Drop services' new columns (also drops their CHECK
--      constraints automatically, including services_price_matches_type,
--      services_price_nonneg, services_duration_positive,
--      services_processing_time_nonneg, services_blocked_time_nonneg) ──
ALTER TABLE services DROP COLUMN IF EXISTS processing_time_min;
ALTER TABLE services DROP COLUMN IF EXISTS blocked_time_min;
ALTER TABLE services DROP COLUMN IF EXISTS is_online_bookable;
ALTER TABLE services DROP COLUMN IF EXISTS tax_rate_override;
ALTER TABLE services DROP COLUMN IF EXISTS archived_at;
ALTER TABLE services DROP COLUMN IF EXISTS updated_at;
ALTER TABLE services DROP COLUMN IF EXISTS price_type;

-- ── Verify ──
SELECT column_name FROM information_schema.columns WHERE table_name = 'services' ORDER BY ordinal_position;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename IN ('services','service_categories') ORDER BY tablename, cmd;
