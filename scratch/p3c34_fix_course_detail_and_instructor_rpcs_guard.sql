-- P3C.34 — Public Data Guard SQL Patch for Course Detail & Instructor Profile RPCs
-- File: scratch/p3c34_fix_course_detail_and_instructor_rpcs_guard.sql

-- 1. RPC: public_get_course_detail
CREATE OR REPLACE FUNCTION public.public_get_course_detail(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', c.id,
    'title', c.title,
    'slug', c.slug,
    'summary', c.summary,
    'description', c.description,
    'cover_url', c.cover_url,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'batches', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'title', b.title,
          'slug', b.slug,
          'training_format', b.training_format,
          'max_participants', b.max_participants,
          'registration_status', LOWER(TRIM(COALESCE(b.registration_status, b.status, 'draft'))),
          'registration_closes_at', b.registration_closes_at,
          'start_date', b.start_date,
          'end_date', b.end_date,
          'description', b.description,
          'confirmed_count', (
            SELECT COUNT(*)::int FROM public.course_registrations r WHERE r.batch_id = b.id AND r.status = 'confirmed'
          ),
          'pending_count', (
            SELECT COUNT(*)::int FROM public.course_registrations r WHERE r.batch_id = b.id AND r.status = 'pending'
          ),
          'instructor', CASE 
            WHEN inst.id IS NOT NULL THEN jsonb_build_object(
              'id', inst.id,
              'full_name', inst.full_name,
              'title', inst.title,
              'avatar_url', inst.avatar_url,
              'expertise', inst.expertise
            )
            ELSE NULL
          END,
          'sessions', (
            SELECT COALESCE(jsonb_agg(
              jsonb_build_object(
                'id', s.id,
                'title', s.title,
                'starts_at', s.starts_at,
                'ends_at', s.ends_at,
                'location_type', s.location_type,
                'location_detail', s.location_detail
              ) ORDER BY s.starts_at ASC
            ), '[]'::jsonb)
            FROM public.course_sessions s
            WHERE s.batch_id = b.id
          )
        ) ORDER BY b.start_date ASC NULLS LAST, b.created_at DESC
      ), '[]'::jsonb)
      FROM public.course_batches b
      LEFT JOIN public.academy_instructors inst ON b.instructor_id = inst.id
      WHERE b.course_id = c.id
        AND LOWER(TRIM(COALESCE(b.registration_status, b.status, 'draft'))) = 'open'
        AND LOWER(b.title) NOT LIKE '%smoke%'
        AND LOWER(b.title) NOT LIKE '%test%'
        AND LOWER(b.title) NOT LIKE '%demo%'
        AND LOWER(b.title) NOT LIKE '%cancel%'
        AND LOWER(COALESCE(b.slug, '')) NOT LIKE '%smoke%'
        AND LOWER(COALESCE(b.slug, '')) NOT LIKE '%test%'
        AND LOWER(COALESCE(b.slug, '')) NOT LIKE '%demo%'
        AND LOWER(COALESCE(b.slug, '')) NOT LIKE '%cancel%'
    )
  ) INTO v_result
  FROM public.courses c
  WHERE c.slug = p_slug
    AND LOWER(c.title) NOT LIKE '%smoke%'
    AND LOWER(c.title) NOT LIKE '%test%'
    AND LOWER(c.title) NOT LIKE '%demo%'
    AND LOWER(c.title) NOT LIKE '%cancel%'
    AND LOWER(COALESCE(c.slug, '')) NOT LIKE '%smoke%'
    AND LOWER(COALESCE(c.slug, '')) NOT LIKE '%test%'
    AND LOWER(COALESCE(c.slug, '')) NOT LIKE '%demo%'
    AND LOWER(COALESCE(c.slug, '')) NOT LIKE '%cancel%';

  RETURN v_result;
END;
$$;


-- 2. RPC: public_get_instructor_profile
CREATE OR REPLACE FUNCTION public.public_get_instructor_profile(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', inst.id,
    'full_name', inst.full_name,
    'slug', inst.slug,
    'title', inst.title,
    'avatar_url', inst.avatar_url,
    'expertise', inst.expertise,
    'bio', inst.bio,
    'highlights', inst.highlights,
    'social_links', inst.social_links,
    'is_active', inst.is_active,
    'batches', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'title', b.title,
          'slug', b.slug,
          'training_format', b.training_format,
          'max_participants', b.max_participants,
          'registration_status', LOWER(TRIM(COALESCE(b.registration_status, b.status, 'draft'))),
          'registration_closes_at', b.registration_closes_at,
          'start_date', b.start_date,
          'end_date', b.end_date,
          'description', b.description,
          'confirmed_count', (
            SELECT COUNT(*)::int FROM public.course_registrations r WHERE r.batch_id = b.id AND r.status = 'confirmed'
          ),
          'pending_count', (
            SELECT COUNT(*)::int FROM public.course_registrations r WHERE r.batch_id = b.id AND r.status = 'pending'
          ),
          'course', jsonb_build_object(
            'id', c.id,
            'title', c.title,
            'slug', c.slug,
            'cover_url', c.cover_url,
            'summary', c.summary
          ),
          'sessions', (
            SELECT COALESCE(jsonb_agg(
              jsonb_build_object(
                'id', s.id,
                'title', s.title,
                'starts_at', s.starts_at,
                'ends_at', s.ends_at,
                'location_type', s.location_type,
                'location_detail', s.location_detail
              ) ORDER BY s.starts_at ASC
            ), '[]'::jsonb)
            FROM public.course_sessions s
            WHERE s.batch_id = b.id
          )
        ) ORDER BY b.start_date ASC NULLS LAST, b.created_at DESC
      ), '[]'::jsonb)
      FROM public.course_batches b
      JOIN public.courses c ON b.course_id = c.id
      WHERE b.instructor_id = inst.id
        AND LOWER(TRIM(COALESCE(b.registration_status, b.status, 'draft'))) = 'open'
        AND LOWER(b.title) NOT LIKE '%smoke%'
        AND LOWER(b.title) NOT LIKE '%test%'
        AND LOWER(b.title) NOT LIKE '%demo%'
        AND LOWER(b.title) NOT LIKE '%cancel%'
        AND LOWER(COALESCE(b.slug, '')) NOT LIKE '%smoke%'
        AND LOWER(COALESCE(b.slug, '')) NOT LIKE '%test%'
        AND LOWER(COALESCE(b.slug, '')) NOT LIKE '%demo%'
        AND LOWER(COALESCE(b.slug, '')) NOT LIKE '%cancel%'
        AND LOWER(c.title) NOT LIKE '%smoke%'
        AND LOWER(c.title) NOT LIKE '%test%'
        AND LOWER(c.title) NOT LIKE '%demo%'
        AND LOWER(c.title) NOT LIKE '%cancel%'
        AND LOWER(COALESCE(c.slug, '')) NOT LIKE '%smoke%'
        AND LOWER(COALESCE(c.slug, '')) NOT LIKE '%test%'
        AND LOWER(COALESCE(c.slug, '')) NOT LIKE '%demo%'
        AND LOWER(COALESCE(c.slug, '')) NOT LIKE '%cancel%'
    )
  ) INTO v_result
  FROM public.academy_instructors inst
  WHERE inst.slug = p_slug
    AND inst.is_active = true
    AND LOWER(inst.full_name) NOT LIKE '%smoke%'
    AND LOWER(inst.full_name) NOT LIKE '%test%'
    AND LOWER(inst.full_name) NOT LIKE '%demo%'
    AND LOWER(inst.full_name) NOT LIKE '%cancel%'
    AND LOWER(COALESCE(inst.slug, '')) NOT LIKE '%smoke%'
    AND LOWER(COALESCE(inst.slug, '')) NOT LIKE '%test%'
    AND LOWER(COALESCE(inst.slug, '')) NOT LIKE '%demo%'
    AND LOWER(COALESCE(inst.slug, '')) NOT LIKE '%cancel%';

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.public_get_course_detail(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_get_instructor_profile(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
