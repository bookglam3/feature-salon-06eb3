-- ============================================================
-- Add missing columns to salons table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Add phone column
ALTER TABLE salons ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add city column  
ALTER TABLE salons ADD COLUMN IF NOT EXISTS city TEXT;

-- Add category column
ALTER TABLE salons ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'hair';

-- Add country column
ALTER TABLE salons ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'GB';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- ✅ After running this, signup will save phone, city & category correctly.
