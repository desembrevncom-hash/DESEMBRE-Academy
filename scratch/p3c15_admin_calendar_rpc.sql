CREATE OR REPLACE FUNCTION admin_get_calendar()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  location_type text,
  location_detail text,
  order_index integer,
  status text,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  batch_id uuid,
  student_count bigint,
  confirmed_student_count bigint,
  course_batches jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin_or_sub_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    cs.id, cs.title, cs.description, cs.starts_at, cs.ends_at, cs.location_type, cs.location_detail, cs.order_index,
    cs.status, cs.completed_at, cs.cancelled_at, cs.cancellation_reason, cs.batch_id,
    COALESCE(r.total_count, 0) as student_count,
    COALESCE(r.confirmed_count, 0) as confirmed_student_count,
    CASE 
      WHEN cb.id IS NOT NULL THEN
        jsonb_build_object(
          'id', cb.id,
          'slug', cb.slug,
          'title', cb.title,
          'training_format', cb.training_format,
          'status', cb.status,
          'registration_opens_at', cb.registration_opens_at,
          'registration_closes_at', cb.registration_closes_at,
          'courses', CASE WHEN c.id IS NOT NULL THEN jsonb_build_object('id', c.id, 'slug', c.slug, 'title', c.title) ELSE NULL END
        )
      ELSE NULL
    END as course_batches
  FROM public.course_sessions cs
  LEFT JOIN public.course_batches cb ON cs.batch_id = cb.id
  LEFT JOIN public.courses c ON cb.course_id = c.id
  LEFT JOIN (
    SELECT 
      cr.batch_id, 
      COUNT(cr.id) as total_count,
      COUNT(cr.id) FILTER (WHERE cr.status = 'confirmed') as confirmed_count
    FROM public.course_registrations cr
    GROUP BY cr.batch_id
  ) r ON cs.batch_id = r.batch_id
  ORDER BY cs.starts_at ASC;
END;
$$;
