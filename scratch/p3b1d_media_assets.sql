-- Create public.academy_media_assets table
CREATE TABLE IF NOT EXISTS public.academy_media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_type TEXT NOT NULL, -- e.g., 'course_thumbnail', 'lesson_content'
    related_entity_id TEXT, -- e.g., course_id
    file_path TEXT NOT NULL, -- path in storage
    public_url TEXT NOT NULL, -- the public URL
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- RLS for academy_media_assets
ALTER TABLE public.academy_media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to academy_media_assets"
    ON public.academy_media_assets
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow admin full access to academy_media_assets"
    ON public.academy_media_assets
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- Create bucket 'academy-public-assets' if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'academy-public-assets',
    'academy-public-assets',
    true,
    3145728, -- 3MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 3145728,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS for 'academy-public-assets'
CREATE POLICY "Public Access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'academy-public-assets');

CREATE POLICY "Admin Insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'academy-public-assets' AND
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

CREATE POLICY "Admin Update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'academy-public-assets' AND
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

CREATE POLICY "Admin Delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'academy-public-assets' AND
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );
