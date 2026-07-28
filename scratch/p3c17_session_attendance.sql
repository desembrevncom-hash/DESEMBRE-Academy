-- Create table for session attendance
CREATE TABLE IF NOT EXISTS public.course_session_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.course_sessions(id) on delete cascade,
  registration_id uuid not null references public.course_registrations(id) on delete cascade,
  status text not null default 'not_marked',
  checked_in_at timestamptz null,
  note text null,
  created_by uuid null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint course_session_attendance_status_check check (status in ('not_marked', 'present', 'absent', 'late', 'excused')),
  constraint course_session_attendance_session_registration_key unique (session_id, registration_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS course_session_attendance_session_id_idx ON public.course_session_attendance (session_id);
CREATE INDEX IF NOT EXISTS course_session_attendance_registration_id_idx ON public.course_session_attendance (registration_id);
CREATE INDEX IF NOT EXISTS course_session_attendance_status_idx ON public.course_session_attendance (status);

-- Enable RLS
ALTER TABLE public.course_session_attendance ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage course session attendance" ON public.course_session_attendance
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_sub_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_sub_admin(auth.uid()));

-- RPC: admin_get_session_attendance
CREATE OR REPLACE FUNCTION admin_get_session_attendance(p_session_id uuid)
RETURNS TABLE (
  id uuid,
  session_id uuid,
  registration_id uuid,
  status text,
  checked_in_at timestamptz,
  note text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin_or_sub_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT a.id, a.session_id, a.registration_id, a.status, a.checked_in_at, a.note, a.created_at, a.updated_at
  FROM public.course_session_attendance a
  WHERE a.session_id = p_session_id;
END;
$$;

-- RPC: admin_upsert_session_attendance
CREATE OR REPLACE FUNCTION admin_upsert_session_attendance(
  p_session_id uuid,
  p_registration_id uuid,
  p_status text,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin_or_sub_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO public.course_session_attendance (
    session_id, 
    registration_id, 
    status, 
    note, 
    checked_in_at,
    created_by
  )
  VALUES (
    p_session_id, 
    p_registration_id, 
    p_status, 
    p_note, 
    CASE WHEN p_status IN ('present', 'late') THEN now() ELSE null END,
    auth.uid()
  )
  ON CONFLICT (session_id, registration_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    note = COALESCE(EXCLUDED.note, course_session_attendance.note),
    checked_in_at = CASE 
      WHEN EXCLUDED.status IN ('present', 'late') AND course_session_attendance.checked_in_at IS NULL THEN now()
      WHEN EXCLUDED.status NOT IN ('present', 'late') THEN null
      ELSE course_session_attendance.checked_in_at
    END,
    updated_at = now();
END;
$$;

-- RPC: admin_clear_session_attendance
CREATE OR REPLACE FUNCTION admin_clear_session_attendance(
  p_session_id uuid,
  p_registration_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin_or_sub_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  DELETE FROM public.course_session_attendance
  WHERE session_id = p_session_id AND registration_id = p_registration_id;
END;
$$;
