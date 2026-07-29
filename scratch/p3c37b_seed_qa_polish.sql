-- P3C.37B — Admin Content QA & Seed Polish SQL
-- Run on Supabase SQL Editor to verify or repair synergistic-protocol landing record

-- ─── 1. Verify Landing Page Record ───────────────────────────────────────────
SELECT 
  id,
  title,
  slug,
  course_id,
  hero_badge,
  hero_title,
  hero_subtitle,
  primary_cta_label,
  secondary_cta_label,
  jsonb_array_length(audience) as audience_count,
  jsonb_array_length(outcomes) as outcomes_count,
  jsonb_array_length(curriculum_fallback) as curriculum_count,
  jsonb_array_length(trust_items) as trust_count,
  jsonb_array_length(faqs) as faqs_count,
  seo_title,
  is_published,
  updated_at
FROM public.academy_landing_pages
WHERE slug = 'synergistic-protocol';

-- ─── 2. Repair / Ensure Full Data & Published Status ──────────────────────────
UPDATE public.academy_landing_pages
SET 
  is_published = true,
  course_id = COALESCE(
    course_id, 
    (SELECT id FROM public.courses WHERE slug = 'chuyen-de-synergistic-protocol-online' OR title ILIKE '%synergistic protocol%' LIMIT 1)
  ),
  updated_at = now()
WHERE slug = 'synergistic-protocol';
