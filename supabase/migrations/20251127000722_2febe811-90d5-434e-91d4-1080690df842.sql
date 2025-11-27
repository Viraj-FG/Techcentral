-- Create storage bucket for app assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true);

-- Allow public read access
CREATE POLICY "Public read access for app assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-assets');

-- Allow service role to upload
CREATE POLICY "Service role can upload app assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'app-assets');