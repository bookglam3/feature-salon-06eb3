-- ═══════════════════════════════════════════════════════════════
-- STORAGE BUCKET SETUP: salon-assets
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → Run)
-- ═══════════════════════════════════════════════════════════════

-- Create the public storage bucket for salon logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'salon-assets',
  'salon-assets',
  true,                           -- Public: images are accessible via URL
  5242880,                        -- 5MB max file size
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'];

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'salon-assets');

-- Allow public read of all files in bucket
CREATE POLICY "Public read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'salon-assets');

-- Allow users to update/delete their own files
CREATE POLICY "Authenticated update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'salon-assets');

CREATE POLICY "Authenticated delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'salon-assets');

-- Verify bucket created
SELECT id, name, public FROM storage.buckets WHERE id = 'salon-assets';
