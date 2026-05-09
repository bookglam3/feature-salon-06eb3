-- ─── Create salon-assets storage bucket ──────────────────────────────────────
-- Run this in Supabase SQL Editor to create the storage bucket for logo uploads

-- 1. Create the bucket (public = logos accessible without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'salon-assets',
  'salon-assets',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users to upload to their own salon folder
CREATE POLICY "Authenticated users can upload salon logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'salon-assets'
  AND name LIKE 'salon-logos/%'
);

-- 3. Allow authenticated users to update/upsert their logos
CREATE POLICY "Authenticated users can update salon logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'salon-assets'
  AND name LIKE 'salon-logos/%'
);

-- 4. Allow public read access (so booking page can show logo)
CREATE POLICY "Public can view salon logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'salon-assets');

-- 5. Allow authenticated users to delete their own logos
CREATE POLICY "Authenticated users can delete salon logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'salon-assets'
  AND name LIKE 'salon-logos/%'
);
