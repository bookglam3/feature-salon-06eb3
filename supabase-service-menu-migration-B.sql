-- ═══════════════════════════════════════════════════════════════
-- Service Menu — Migration B (destructive — run LATER)
-- ═══════════════════════════════════════════════════════════════
-- DO NOT RUN THIS until supabase-service-menu-migration-A.sql has
-- been run AND the app-code changes are committed, pushed, and
-- deployed to production:
--   - app/dashboard/components/ServiceModal.tsx (sends price_type)
--   - app/api/services/route.ts (writes price_type, not price_is_from)
--
-- Why the wait matters: after this runs, price_is_from becomes a
-- GENERATED column and cannot be written to directly. If the OLD app
-- code (still sending/writing price_is_from) is live when this runs,
-- every service create/update will throw immediately.
--
-- One transaction, nothing else in it.

BEGIN;

ALTER TABLE services
  DROP COLUMN price_is_from,
  ADD COLUMN price_is_from boolean
    GENERATED ALWAYS AS (price_type = 'from') STORED;

COMMIT;
