-- ============================================================
-- Add missing columns to salons table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add city column (nullable text)
ALTER TABLE salons ADD COLUMN IF NOT EXISTS city TEXT;

-- Add category column (nullable text) 
ALTER TABLE salons ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'hair';

-- Add country column (nullable text)
ALTER TABLE salons ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'GB';

-- Refresh schema cache (Supabase)
NOTIFY pgrst, 'reload schema';
