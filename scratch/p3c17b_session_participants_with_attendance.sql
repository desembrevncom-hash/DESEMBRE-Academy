CREATE OR REPLACE FUNCTION public.admin_get_session_participants_with_attendance(
  p_session_id uuid
)
RETURNS TABLE (
  registration_id uuid,
  full_name text,
  phone text,
  email text,
  registration_status text,
  attendance_id uuid,
  attendance_status text,
  checked_in_at timestamptz,
  attendance_note text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id uuid;
BEGIN
  IF NOT public.is_admin_or_sub_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT cs.batch_id
  INTO v_batch_id
  FROM public.course_sessions cs
  WHERE cs.id = p_session_id;

  IF v_batch_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    cr.id AS registration_id,
    cr.full_name,
    cr.phone,
    cr.email,
    cr.status AS registration_status,
    csa.id AS attendance_id,
    COALESCE(csa.status, 'not_marked') AS attendance_status,
    csa.checked_in_at,
    csa.note AS attendance_note
  FROM public.course_registrations cr
  LEFT JOIN public.course_session_attendance csa
    ON csa.registration_id = cr.id
   AND csa.session_id = p_session_id
  WHERE cr.batch_id = v_batch_id
  ORDER BY cr.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_session_participants_with_attendance(uuid) TO authenticated;
