-- ═══════════════════════════════════════════════════════════════
-- FIX: Populate salons.owner_email from auth.users
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Make sure owner_email column exists
ALTER TABLE salons ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- 2. Populate owner_email for all salons where it's missing
UPDATE salons s
SET owner_email = u.email
FROM auth.users u
WHERE s.owner_id = u.id
  AND (s.owner_email IS NULL OR s.owner_email = '');

-- 3. Verify
SELECT id, name, slug, owner_email
FROM salons
ORDER BY created_at DESC;
