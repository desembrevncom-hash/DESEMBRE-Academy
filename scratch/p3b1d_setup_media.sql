-- P3B.1D: Course Thumbnail Media Library MVP
-- 1. Create Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('academy-public-assets', 'academy-public-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure RLS allows public read for this bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'academy-public-assets');
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'academy-public-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING (bucket_id = 'academy-public-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING (bucket_id = 'academy-public-assets' AND auth.role() = 'authenticated');

-- 2. Create tracking table
CREATE TABLE IF NOT EXISTS public.academy_media_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id varchar(255),
    file_path varchar(1000) NOT NULL,
    file_name varchar(500) NOT NULL,
    file_size bigint,
    mime_type varchar(100),
    public_url varchar(2000) NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- RLS for media_assets
ALTER TABLE public.academy_media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read media assets" ON public.academy_media_assets FOR SELECT USING (true);
CREATE POLICY "Auth insert media assets" ON public.academy_media_assets FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON public.academy_media_assets TO anon, authenticated;
GRANT ALL ON public.academy_media_assets TO authenticated;

NOTIFY pgrst, 'reload schema';
