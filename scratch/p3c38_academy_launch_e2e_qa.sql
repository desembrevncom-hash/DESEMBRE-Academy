-- P3C.38 Academy Launch End-to-End Data QA & Polish SQL
-- Run this script in Supabase SQL Editor to polish production batch & course data for SYNERGISTIC PROTOCOL

-- ─── 1. Fix Typo "ONILNE" -> "ONLINE" in Batch Titles ───────────────────────
UPDATE public.course_batches
SET 
  title = REPLACE(title, 'ONILNE', 'ONLINE'),
  updated_at = now()
WHERE title ILIKE '%ONILNE%';

-- ─── 2. Update Registration Closes At & Max Participants for Active Batches ───
UPDATE public.course_batches
SET 
  registration_closes_at = CASE 
    WHEN registration_closes_at IS NULL OR registration_closes_at < now() THEN now() + INTERVAL '30 days'
    ELSE registration_closes_at
  END,
  max_participants = COALESCE(max_participants, 30),
  registration_status = 'open',
  updated_at = now()
WHERE course_id IN (
  SELECT id FROM public.courses WHERE slug = 'chuyen-de-synergistic-protocol-online' OR title ILIKE '%synergistic protocol%'
);

-- ─── 3. Ensure Default Instructor is Assigned if missing ───────────────────
UPDATE public.course_batches
SET 
  instructor_id = (SELECT id FROM public.academy_instructors LIMIT 1),
  updated_at = now()
WHERE instructor_id IS NULL AND course_id IN (
  SELECT id FROM public.courses WHERE slug = 'chuyen-de-synergistic-protocol-online' OR title ILIKE '%synergistic protocol%'
);

-- ─── 4. End-to-End QA Check Query ─────────────────────────────────────────
SELECT 
  b.id as batch_id,
  b.title as batch_title,
  b.registration_status,
  b.registration_closes_at,
  b.max_participants,
  c.title as course_title,
  c.slug as course_slug,
  i.name as instructor_name,
  (SELECT COUNT(*) FROM public.course_sessions s WHERE s.batch_id = b.id) as sessions_count,
  (SELECT COUNT(*) FROM public.course_registrations r WHERE r.batch_id = b.id) as registrations_count
FROM public.course_batches b
JOIN public.courses c ON b.course_id = c.id
LEFT JOIN public.academy_instructors i ON b.instructor_id = i.id
WHERE c.slug = 'chuyen-de-synergistic-protocol-online' OR c.title ILIKE '%synergistic protocol%';
