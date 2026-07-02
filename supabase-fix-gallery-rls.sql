-- ============================================================
-- FIX: Remove unnecessary public-read policy on gallery_photos
-- ============================================================
--
-- WHY:
--   The "Public reads gallery" policy (FOR SELECT USING (true)) allows
--   any anonymous user to read ALL gallery_photos rows across ALL salons
--   with no restriction. No public-facing page in the app queries this
--   table — it is only accessed from the authenticated owner dashboard.
--   The policy is therefore unnecessary and over-permissive.
--
-- SAFE TO RUN:
--   - The "Owner manages gallery" policy is NOT touched — dashboard
--     functionality is unaffected.
--   - No public page reads gallery_photos, so no user-facing feature breaks.
--   - IF NOT EXISTS guard means re-running is safe (idempotent).
--
-- HOW TO RUN:
--   Paste into Supabase SQL editor → Run
-- ============================================================

DROP POLICY IF EXISTS "Public reads gallery" ON gallery_photos;

-- ── Verification query (run after the above) ─────────────────
-- Should return ZERO rows for policyname = 'Public reads gallery'.
-- Should return ONE row for policyname = 'Owner manages gallery'.
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'gallery_photos'
ORDER BY policyname;
