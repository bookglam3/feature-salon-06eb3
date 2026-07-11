-- ═══════════════════════════════════════════════════════════════
-- Client CSV import — clients table + GDPR import audit log
-- ═══════════════════════════════════════════════════════════════
-- Run this once in the Supabase SQL editor.
--
-- NOTE: two older migration files (supabase-whatsapp-migration.sql,
-- supabase-setup-and-test.sql) reference a "clients" table via
-- `ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_opt_out ...`.
-- If that table already exists live with an unknown shape, this script
-- is written additively (ALTER ... ADD COLUMN IF NOT EXISTS) so it will
-- not clobber or fail against it. It never drops or renames a column.

-- ── clients ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS salon_id          uuid REFERENCES salons(id) ON DELETE CASCADE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS name              text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email             text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone             text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes             text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_of_birth     date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_visit_at     timestamptz;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source            text NOT NULL DEFAULT 'manual';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS marketing_opt_out boolean NOT NULL DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at        timestamptz NOT NULL DEFAULT now();
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at        timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS clients_salon_id_idx ON clients (salon_id);

-- Partial unique indexes power the import dedup (email first, then phone).
-- Wrapped in DO blocks so a pre-existing live table with duplicate data
-- (unlikely — this table is not queried anywhere in the app today) logs a
-- warning instead of aborting the whole migration.
DO $$
BEGIN
  CREATE UNIQUE INDEX clients_salon_email_uq ON clients (salon_id, lower(email))
    WHERE email IS NOT NULL AND email <> '';
EXCEPTION WHEN duplicate_table THEN
  NULL;
WHEN OTHERS THEN
  RAISE NOTICE 'clients_salon_email_uq not created — existing duplicate (salon_id, email) rows found. Dedupe manually then re-run.';
END $$;

DO $$
BEGIN
  CREATE UNIQUE INDEX clients_salon_phone_uq ON clients (salon_id, phone)
    WHERE phone IS NOT NULL AND phone <> '';
EXCEPTION WHEN duplicate_table THEN
  NULL;
WHEN OTHERS THEN
  RAISE NOTICE 'clients_salon_phone_uq not created — existing duplicate (salon_id, phone) rows found. Dedupe manually then re-run.';
END $$;

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Salon owners manage own clients" ON clients;
CREATE POLICY "Salon owners manage own clients" ON clients
  FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- ── client_import_logs — GDPR lawful-basis confirmation audit trail ──
CREATE TABLE IF NOT EXISTS client_import_logs (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id                uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  user_id                 uuid NOT NULL,
  filename                text,
  row_count               int NOT NULL DEFAULT 0,
  imported_count          int NOT NULL DEFAULT 0,
  duplicate_count         int NOT NULL DEFAULT 0,
  skipped_count           int NOT NULL DEFAULT 0,
  lawful_basis_confirmed  boolean NOT NULL DEFAULT false,
  confirmed_at            timestamptz NOT NULL DEFAULT now(),
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_import_logs_salon_id_idx ON client_import_logs (salon_id);

ALTER TABLE client_import_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Salon owners view own import logs" ON client_import_logs;
CREATE POLICY "Salon owners view own import logs" ON client_import_logs
  FOR SELECT
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
-- No INSERT/UPDATE policy: rows are written only by /api/clients/import
-- using the service-role key, which bypasses RLS entirely.
