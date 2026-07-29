-- P3C.32A Fix Public Training Schedule RPC
-- File: scratch/p3c32a_fix_public_training_schedule_filter.sql

CREATE OR REPLACE FUNCTION public.public_get_training_schedule()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'title', b.title,
      'slug', b.slug,
      'training_format', b.training_format,
      'max_participants', b.max_participants,
      'registration_status', COALESCE(b.registration_status, b.status, 'open'),
      'registration_closes_at', b.registration_closes_at,
      'start_date', b.start_date,
      'end_date', b.end_date,
      'description', b.description,
      'confirmed_count', (
        SELECT COUNT(*)::int 
        FROM public.course_registrations r 
        WHERE r.batch_id = b.id AND r.status = 'confirmed'
      ),
      'pending_count', (
        SELECT COUNT(*)::int 
        FROM public.course_registrations r 
        WHERE r.batch_id = b.id AND r.status = 'pending'
      ),
      'course', jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'slug', c.slug,
        'cover_url', c.cover_url,
        'summary', c.summary
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
  ), '[]'::jsonb) INTO v_result
  FROM public.course_batches b
  JOIN public.courses c ON b.course_id = c.id
  LEFT JOIN public.academy_instructors inst ON b.instructor_id = inst.id
  WHERE LOWER(COALESCE(b.registration_status, b.status, 'open')) IN ('open', 'published', 'upcoming', 'ongoing');

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.public_get_training_schedule() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
