-- ====================================================================
-- P3C.55 — Landing Lead Source Tracking & Campaign Attribution
-- File: scratch/p3c55_landing_lead_source_tracking.sql
-- ====================================================================

-- 1. DROP previous signatures if needed to allow signature expansion
DROP FUNCTION IF EXISTS public.public_submit_course_registration(uuid, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.public_submit_course_registration(uuid, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.public_submit_course_registration(uuid, text, text, text, text, text, text, text, text, text) CASCADE;

-- 2. CREATE updated public_submit_course_registration with attribution params
CREATE OR REPLACE FUNCTION public.public_submit_course_registration(
  p_batch_id uuid,
  p_full_name text,
  p_phone text,
  p_email text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_source text DEFAULT 'public_schedule',
  p_campaign_slug text DEFAULT NULL,
  p_utm_source text DEFAULT NULL,
  p_utm_medium text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch public.course_batches%ROWTYPE;
  v_course_title text;
  v_course_name text;
  v_clean_phone text;
  v_existing_id uuid;
  v_registration_id uuid;
  v_training_format_label text;
  v_participation_format text;
  v_class_date text;
  v_session_time text;
  v_batch_name text;
  v_registration_code text;
  v_final_source text;
  v_attribution text := '';
  v_final_notes text;
BEGIN
  -- 1. Validate inputs
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'FULL_NAME_REQUIRED';
  END IF;

  IF p_phone IS NULL OR trim(p_phone) = '' THEN
    RAISE EXCEPTION 'PHONE_REQUIRED';
  END IF;

  -- 2. Clean phone digits
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');
  IF v_clean_phone = '' THEN
    RAISE EXCEPTION 'INVALID_PHONE_NUMBER';
  END IF;

  -- 3. Resolve source & build attribution text for notes
  v_final_source := COALESCE(NULLIF(trim(p_source), ''), 'public_schedule');

  IF p_campaign_slug IS NOT NULL AND trim(p_campaign_slug) <> '' THEN
    v_attribution := v_attribution || '[campaign: ' || trim(p_campaign_slug) || '] ';
  END IF;
  IF p_utm_source IS NOT NULL AND trim(p_utm_source) <> '' THEN
    v_attribution := v_attribution || '[utm_source: ' || trim(p_utm_source) || '] ';
  END IF;
  IF p_utm_medium IS NOT NULL AND trim(p_utm_medium) <> '' THEN
    v_attribution := v_attribution || '[utm_medium: ' || trim(p_utm_medium) || '] ';
  END IF;
  IF p_utm_campaign IS NOT NULL AND trim(p_utm_campaign) <> '' THEN
    v_attribution := v_attribution || '[utm_campaign: ' || trim(p_utm_campaign) || '] ';
  END IF;

  v_final_notes := trim(COALESCE(trim(p_notes), '') || ' ' || trim(v_attribution));
  IF v_final_notes = '' THEN
    v_final_notes := NULL;
  END IF;

  -- 4. Verify batch exists & fetch course info
  SELECT * INTO v_batch FROM public.course_batches WHERE id = p_batch_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BATCH_NOT_FOUND';
  END IF;

  -- Fetch course title & clean "Chuyên đề:" prefix
  SELECT title INTO v_course_title FROM public.courses WHERE id = v_batch.course_id;
  IF v_course_title IS NOT NULL AND trim(v_course_title) <> '' THEN
    v_course_name := trim(regexp_replace(v_course_title, '^\s*Chuyên\s+đề\s*:\s*', '', 'i'));
  ELSE
    v_course_name := coalesce(v_batch.title, 'Khóa học Đào tạo');
  END IF;

  -- 5. Map training_format_label & participation_format
  v_training_format_label := CASE lower(coalesce(v_batch.training_format, ''))
    WHEN 'zoom' THEN 'Online Zoom'
    WHEN 'online' THEN 'Online Zoom'
    WHEN 'office' THEN 'Học tại văn phòng'
    WHEN 'offline' THEN 'Học tại văn phòng'
    WHEN 'hands_on' THEN 'Học tại văn phòng'
    WHEN 'hand_on' THEN 'Học tại văn phòng'
    WHEN 'hands-on' THEN 'Học tại văn phòng'
    WHEN 'hybrid' THEN 'Hybrid'
    WHEN 'external_seminar' THEN 'Seminar'
    WHEN 'seminar' THEN 'Seminar'
    ELSE 'Lớp đào tạo'
  END;
  v_participation_format := v_training_format_label;

  -- 6. Fetch first session info if available
  SELECT
    to_char(starts_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY'),
    to_char(starts_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI') || '–' || to_char(ends_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI')
  INTO v_class_date, v_session_time
  FROM public.course_sessions
  WHERE batch_id = p_batch_id
  ORDER BY starts_at ASC
  LIMIT 1;

  IF v_class_date IS NULL AND v_batch.start_date IS NOT NULL THEN
    v_class_date := to_char(v_batch.start_date AT TIME ZONE 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY');
  END IF;

  IF v_class_date IS NOT NULL AND v_session_time IS NOT NULL THEN
    v_batch_name := v_class_date || ' • ' || v_session_time;
  ELSIF v_class_date IS NOT NULL THEN
    v_batch_name := v_class_date;
  ELSE
    v_batch_name := 'Lịch học sẽ được xác nhận sau';
  END IF;

  -- 7. Check existing active registration for same batch + phone
  SELECT id INTO v_existing_id
  FROM public.course_registrations
  WHERE batch_id = p_batch_id
    AND (
      regexp_replace(phone, '\D', '', 'g') = v_clean_phone
      OR (
        pg_proc_exists('public.normalize_vn_phone') 
        AND public.normalize_vn_phone(phone) = public.normalize_vn_phone(p_phone)
      )
    )
    AND status IN ('pending', 'contacted', 'confirmed', 'enrolled')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'registration_id', v_existing_id,
      'message', 'ALREADY_REGISTERED'
    );
  END IF;

  -- 8. Safe Insert with Exception Handler for Unique Violation
  BEGIN
    INSERT INTO public.course_registrations (
      batch_id,
      full_name,
      phone,
      email,
      notes,
      status,
      source,
      created_at,
      updated_at
    ) VALUES (
      p_batch_id,
      trim(p_full_name),
      trim(p_phone),
      NULLIF(trim(p_email), ''),
      v_final_notes,
      'pending',
      v_final_source,
      now(),
      now()
    )
    RETURNING id INTO v_registration_id;

    -- Compute registration_code (8 chars upper)
    v_registration_code := upper(substr(replace(v_registration_id::text, '-', ''), 1, 8));

    -- Queue ZNS outbox job
    INSERT INTO public.notification_outbox (
      registration_id,
      channel,
      template_code,
      sender_key,
      payload,
      status,
      attempt_count,
      max_attempts,
      next_attempt_at,
      created_at,
      updated_at
    ) VALUES (
      v_registration_id,
      'zns',
      'registration_received',
      'oa_desembre',
      jsonb_build_object(
        'customer_name', trim(p_full_name),
        'full_name', trim(p_full_name),
        'phone', trim(p_phone),
        'course_id', v_batch.course_id,
        'course_name', v_course_name,
        'batch_id', p_batch_id,
        'batch_title', v_batch.title,
        'batch_name', v_batch_name,
        'training_format', v_training_format_label,
        'training_format_label', v_training_format_label,
        'participation_format', v_participation_format,
        'class_date', coalesce(v_class_date, ''),
        'session_time', coalesce(v_session_time, ''),
        'registration_code', v_registration_code
      ),
      'queued',
      0,
      3,
      now(),
      now(),
      now()
    );

    RETURN jsonb_build_object(
      'ok', true,
      'duplicate', false,
      'registration_id', v_registration_id,
      'message', 'REGISTRATION_CREATED'
    );

  EXCEPTION WHEN unique_violation THEN
    SELECT id INTO v_existing_id
    FROM public.course_registrations
    WHERE batch_id = p_batch_id
      AND regexp_replace(phone, '\D', '', 'g') = v_clean_phone
    LIMIT 1;

    RETURN jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'registration_id', v_existing_id,
      'message', 'ALREADY_REGISTERED'
    );
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.public_submit_course_registration(uuid, text, text, text, text, text, text, text, text, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
