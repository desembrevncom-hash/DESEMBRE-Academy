-- P3C.37 Fix RLS Policies for public.academy_landing_pages
-- Run this script in Supabase SQL Editor to ensure Admin UI can view all landing pages (draft & published)

-- Enable RLS
ALTER TABLE public.academy_landing_pages ENABLE ROW LEVEL SECURITY;

-- Drop previous policies
DROP POLICY IF EXISTS "Public can view published landing pages" ON public.academy_landing_pages;
DROP POLICY IF EXISTS "Admins full management landing pages" ON public.academy_landing_pages;
DROP POLICY IF EXISTS "Authenticated users can select all landing pages" ON public.academy_landing_pages;
DROP POLICY IF EXISTS "Anon can view published landing pages" ON public.academy_landing_pages;

-- 1. Allow ALL authenticated users (Admins, Sub-admins, Staff) to SELECT all rows (draft & published)
CREATE POLICY "Authenticated users can select all landing pages"
  ON public.academy_landing_pages
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Allow anon (unauthenticated public visitors) to SELECT published landing pages only
CREATE POLICY "Anon can view published landing pages"
  ON public.academy_landing_pages
  FOR SELECT
  TO anon
  USING (is_published = true);

-- 3. Allow Admins/Sub-admins full management (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins full management landing pages"
  ON public.academy_landing_pages
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_sub_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_sub_admin(auth.uid()));

-- Grant permissions
GRANT ALL ON public.academy_landing_pages TO authenticated;
GRANT SELECT ON public.academy_landing_pages TO anon;
GRANT ALL ON public.academy_landing_pages TO service_role;

-- Verification query:
SELECT id, title, slug, is_published, created_at, updated_at 
FROM public.academy_landing_pages;
