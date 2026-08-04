-- ====================================================================
-- P3C.65I — Student Phone Access Check SECURITY DEFINER RPC
-- File: scratch/p3c65i_check_student_phone_access_rpc.sql
-- ====================================================================

-- 1. DROP previous function if exists
DROP FUNCTION IF EXISTS public.check_student_phone_access(text) CASCADE;

-- 2. CREATE SECURITY DEFINER RPC for student phone eligibility check
CREATE OR REPLACE FUNCTION public.check_student_phone_access(
  p_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_phone_raw text;
  v_phone_digits text;
  v_phone_e164 text;
  v_phone_local text;
  v_courses jsonb := '[]'::jsonb;
  v_count integer := 0;
BEGIN
  IF p_phone IS NULL OR trim(p_phone) = '' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'phone_e164', null,
      'course_count', 0,
      'courses', '[]'::jsonb,
      'message', 'INVALID_PHONE'
    );
  END IF;

  v_phone_raw := trim(p_phone);
  v_phone_digits := regexp_replace(v_phone_raw, '[^\d]', '', 'g');

  IF length(v_phone_digits) < 8 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'phone_e164', null,
      'course_count', 0,
      'courses', '[]'::jsonb,
      'message', 'INVALID_PHONE_DIGITS'
    );
  END IF;

  -- Normalize E.164 and local formats
  IF v_phone_digits LIKE '84%' THEN
    v_phone_e164 := '+' || v_phone_digits;
    v_phone_local := '0' || substr(v_phone_digits, 3);
  ELSIF v_phone_digits LIKE '0%' THEN
    v_phone_e164 := '+84' || substr(v_phone_digits, 2);
    v_phone_local := v_phone_digits;
  ELSE
    v_phone_e164 := '+84' || v_phone_digits;
    v_phone_local := '0' || v_phone_digits;
  END IF;

  -- 1. Priority 1: Query active student_course_access joined with courses & course_batches
  SELECT 
    coalesce(jsonb_agg(
      jsonb_build_object(
        'access_id', a.id,
        'course_id', a.course_id,
        'batch_id', a.batch_id,
        'course_title', c.title,
        'course_slug', c.slug,
        'batch_title', b.title,
        'access_status', a.access_status,
        'starts_at', a.starts_at,
        'expires_at', a.expires_at
      )
    ), '[]'::jsonb),
    count(*)
  INTO v_courses, v_count
  FROM public.student_course_access a
  LEFT JOIN public.courses c ON c.id = a.course_id
  LEFT JOIN public.course_batches b ON b.id = a.batch_id
  WHERE a.access_status = 'active'
    AND (a.expires_at IS NULL OR a.expires_at > now())
    AND (
      a.phone_e164 = v_phone_e164
      OR a.phone = v_phone_local
      OR regexp_replace(a.phone, '[^\d]', '', 'g') = v_phone_digits
      OR regexp_replace(a.phone_e164, '[^\d]', '', 'g') = v_phone_digits
    );

  IF v_count > 0 THEN
    RETURN jsonb_build_object(
      'ok', true,
      'phone_e164', v_phone_e164,
      'course_count', v_count,
      'courses', v_courses,
      'message', 'STUDENT_ACCESS_ACTIVE'
    );
  END IF;

  -- 2. Priority 2: Fallback to course_registrations with confirmed/enrolled/paid/completed
  SELECT count(*) INTO v_count
  FROM public.course_registrations r
  WHERE coalesce(r.status, 'pending') IN ('confirmed', 'enrolled', 'paid', 'completed')
    AND (
      regexp_replace(r.phone, '[^\d]', '', 'g') = v_phone_digits
      OR regexp_replace(r.phone, '[^\d]', '', 'g') = regexp_replace(v_phone_local, '[^\d]', '', 'g')
    );

  IF v_count > 0 THEN
    RETURN jsonb_build_object(
      'ok', true,
      'phone_e164', v_phone_e164,
      'course_count', v_count,
      'courses', '[]'::jsonb,
      'message', 'REGISTRATION_CONFIRMED'
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', false,
    'phone_e164', v_phone_e164,
    'course_count', 0,
    'courses', '[]'::jsonb,
    'message', 'NO_STUDENT_ACCOUNT'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_student_phone_access(text) TO anon, authenticated, service_role, postgres;

NOTIFY pgrst, 'reload schema';
