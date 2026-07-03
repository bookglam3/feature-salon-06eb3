-- ============================================================
-- Push Subscriptions Table
-- ============================================================
-- Stores Web Push (VAPID) device subscriptions for salon owners.
-- The server reads this table via the service-role key (bypasses RLS)
-- when sending push notifications on booking events.
--
-- ADDITIVE ONLY — no existing table is altered.
-- Run this in the Supabase SQL editor.
-- ============================================================

-- ── Table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id   UUID        NOT NULL REFERENCES salons(id)     ON DELETE CASCADE,
  endpoint   TEXT        NOT NULL,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One row per device: upsert on re-subscribe instead of duplicating
  CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint)
);

-- ── RLS ───────────────────────────────────────────────────────

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- SELECT: an owner can only read subscriptions that belong to their own user account.
CREATE POLICY "Owner reads own push subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: an owner can only insert a subscription for themselves,
-- and only for a salon they actually own.
CREATE POLICY "Owner inserts own push subscriptions"
  ON push_subscriptions
  FOR INSERT
  WITH CHECK (
    user_id  = auth.uid()
    AND salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- DELETE: an owner can only delete their own subscription rows.
CREATE POLICY "Owner deletes own push subscriptions"
  ON push_subscriptions
  FOR DELETE
  USING (user_id = auth.uid());

-- ── Index ─────────────────────────────────────────────────────

-- Used when the server fetches all subscriptions for a salon to fan-out a push.
CREATE INDEX IF NOT EXISTS push_subscriptions_salon_id_idx
  ON push_subscriptions (salon_id);

-- ── Verification query (run after the above) ──────────────────
-- Should return one row for push_subscriptions with RLS enabled.
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'push_subscriptions';
