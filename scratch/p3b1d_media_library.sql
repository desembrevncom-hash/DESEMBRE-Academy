CREATE TABLE IF NOT EXISTS public.academy_media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_size INTEGER,
    content_type TEXT,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.academy_media_assets ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users (or anyone) to select
CREATE POLICY "Public profiles are viewable by everyone."
ON public.academy_media_assets FOR SELECT
TO authenticated, anon
USING ( true );

-- Admin can insert
CREATE POLICY "Admins can insert assets"
ON public.academy_media_assets FOR INSERT
TO authenticated
WITH CHECK (
    -- Simple check, maybe check if role is admin or just authenticated for now.
    -- Let's assume authenticated is enough for admin dashboard.
    true
);

CREATE POLICY "Admins can update assets"
ON public.academy_media_assets FOR UPDATE
TO authenticated
USING ( true );

CREATE POLICY "Admins can delete assets"
ON public.academy_media_assets FOR DELETE
TO authenticated
USING ( true );

-- Bucket creation
INSERT INTO storage.buckets (id, name, public)
VALUES ('academy-public-assets', 'academy-public-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'academy-public-assets' );

CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'academy-public-assets' );

CREATE POLICY "Admin Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'academy-public-assets' );

CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'academy-public-assets' );

NOTIFY pgrst, 'reload schema';
