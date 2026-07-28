-- P3C.4 Admin Session Management RPCs
-- Run this on Supabase SQL Editor

-- ─── 1. admin_get_batch_sessions ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_batch_sessions(p_batch_id uuid)
RETURNS TABLE (
  id uuid,
  batch_id uuid,
  title text,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  location_type text,
  location_detail text,
  order_index int,
  created_at timestamptz,
  updated_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin_or_sub_admin(auth.uid()) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED';
  END IF;

  RETURN QUERY
  SELECT
    cs.id,
    cs.batch_id,
    cs.title,
    cs.description,
    cs.starts_at,
    cs.ends_at,
    cs.location_type::text,
    cs.location_detail,
    COALESCE(cs.order_index, 0) as order_index,
    cs.created_at,
    cs.updated_at
  FROM public.course_sessions cs
  WHERE cs.batch_id = p_batch_id
  ORDER BY cs.starts_at ASC NULLS LAST, COALESCE(cs.order_index, 0) ASC;
END;
$$;

-- ─── 2. admin_create_course_session ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_create_course_session(
  p_batch_id uuid,
  p_title text,
  p_description text DEFAULT NULL,
  p_starts_at timestamptz DEFAULT NULL,
  p_ends_at timestamptz DEFAULT NULL,
  p_location_type text DEFAULT 'office',
  p_location_detail text DEFAULT NULL,
  p_order_index int DEFAULT 0
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_id uuid;
BEGIN
  IF NOT public.is_admin_or_sub_admin(auth.uid()) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED';
  END IF;

  INSERT INTO public.course_sessions (
    batch_id, title, description,
    starts_at, ends_at,
    location_type, location_detail, order_index
  ) VALUES (
    p_batch_id, p_title, p_description,
    p_starts_at, p_ends_at,
    p_location_type, p_location_detail, p_order_index
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- ─── 3. admin_update_course_session ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_update_course_session(
  p_session_id uuid,
  p_title text,
  p_description text DEFAULT NULL,
  p_starts_at timestamptz DEFAULT NULL,
  p_ends_at timestamptz DEFAULT NULL,
  p_location_type text DEFAULT 'office',
  p_location_detail text DEFAULT NULL,
  p_order_index int DEFAULT 0
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin_or_sub_admin(auth.uid()) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED';
  END IF;

  UPDATE public.course_sessions
  SET
    title = p_title,
    description = p_description,
    starts_at = p_starts_at,
    ends_at = p_ends_at,
    location_type = p_location_type,
    location_detail = p_location_detail,
    order_index = p_order_index,
    updated_at = now()
  WHERE id = p_session_id;
END;
$$;

-- ─── 4. admin_delete_course_session ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_delete_course_session(p_session_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin_or_sub_admin(auth.uid()) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED';
  END IF;

  DELETE FROM public.course_sessions WHERE id = p_session_id;
END;
$$;

-- ─── Verification ─────────────────────────────────────────────────────────────
-- Run after applying above to confirm:
SELECT proname, pg_get_function_identity_arguments(oid) as args
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname ILIKE '%session%'
ORDER BY p.proname;

-- Check course_sessions columns exist:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'course_sessions'
ORDER BY ordinal_position;
