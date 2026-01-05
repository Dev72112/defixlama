-- Create token-logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'token-logos',
  'token-logos', 
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
);

-- Allow public read access
CREATE POLICY "Public read access for token logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'token-logos');

-- Allow authenticated admins to upload
CREATE POLICY "Admin upload access for token logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'token-logos' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update (replace)
CREATE POLICY "Admin update access for token logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'token-logos' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to delete
CREATE POLICY "Admin delete access for token logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'token-logos' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);