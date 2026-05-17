-- ============================================================
-- Feature Salon — Create salon-assets storage bucket
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'salon-assets',
  'salon-assets',
  true,                          -- Public bucket (logos need to be publicly visible)
  5242880,                       -- 5MB max file size
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- 2. Allow authenticated users to upload their own salon logo
CREATE POLICY "Salon owners can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'salon-assets'
  AND (storage.foldername(name))[1] = 'salon-logos'
);

-- 3. Allow public READ access to all logos
CREATE POLICY "Public can view salon logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'salon-assets');

-- 4. Allow authenticated users to UPDATE/DELETE their own logo
CREATE POLICY "Salon owners can update their logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'salon-assets')
WITH CHECK (bucket_id = 'salon-assets');

CREATE POLICY "Salon owners can delete their logo"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'salon-assets');

-- Verify bucket was created
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'salon-assets';
