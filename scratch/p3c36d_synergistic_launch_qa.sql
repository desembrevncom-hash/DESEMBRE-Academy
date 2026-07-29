-- P3C.36D — SYNERGISTIC PROTOCOL Production Launch QA
-- Run on Supabase SQL Editor to audit database readiness for SYNERGISTIC PROTOCOL landing page

-- ─── 1. Check Course Metadata ────────────────────────────────────────────────
SELECT 
  id, 
  title, 
  slug, 
  status, 
  catalog_visibility, 
  cover_url IS NOT NULL as has_cover_url,
  summary IS NOT NULL as has_summary,
  created_at
FROM public.courses
WHERE slug = 'chuyen-de-synergistic-protocol-online' 
   OR title ILIKE '%synergistic protocol%';

-- ─── 2. Check Course Batches & Open Status ────────────────────────────────────
SELECT 
  b.id as batch_id,
  b.title as batch_title,
  b.slug as batch_slug,
  LOWER(TRIM(COALESCE(b.registration_status, b.status, 'draft'))) as normalized_status,
  b.start_date,
  b.end_date,
  b.registration_closes_at,
  b.max_participants,
  b.instructor_id,
  i.full_name as instructor_name,
  (SELECT COUNT(*) FROM public.course_sessions cs WHERE cs.batch_id = b.id) as sessions_count
FROM public.course_batches b
LEFT JOIN public.academy_instructors i ON i.id = b.instructor_id
JOIN public.courses c ON c.id = b.course_id
WHERE c.slug = 'chuyen-de-synergistic-protocol-online' 
   OR c.title ILIKE '%synergistic protocol%'
ORDER BY b.created_at DESC;

-- ─── 3. Test Public Schedule RPC Output ──────────────────────────────────────
SELECT 
  jsonb_array_length(public.public_get_training_schedule()) as total_public_open_batches,
  (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(public.public_get_training_schedule()) elem
    WHERE elem->'course'->>'slug' = 'chuyen-de-synergistic-protocol-online'
       OR elem->'course'->>'title' ILIKE '%synergistic protocol%'
       OR elem->>'title' ILIKE '%synergistic protocol%'
  ) as synergistic_open_batches_data;
