-- P3C.5 Lead Management Pipeline SQL

-- 1. Alter course_registrations table to add new columns
ALTER TABLE public.course_registrations 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_note text NULL,
  ADD COLUMN IF NOT EXISTS contacted_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Normalize existing data if any
UPDATE public.course_registrations
SET status = 'pending'
WHERE status IS NULL OR status NOT IN ('pending', 'contacted', 'confirmed', 'rejected', 'cancelled');

-- Drop old constraint if exists to avoid conflicts
ALTER TABLE public.course_registrations DROP CONSTRAINT IF EXISTS course_registrations_status_check;

-- Add CHECK constraint for status
ALTER TABLE public.course_registrations
  ADD CONSTRAINT course_registrations_status_check
  CHECK (status IN ('pending', 'contacted', 'confirmed', 'rejected', 'cancelled'));

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_course_registrations_batch_id ON public.course_registrations(batch_id);
CREATE INDEX IF NOT EXISTS idx_course_registrations_status ON public.course_registrations(status);
CREATE INDEX IF NOT EXISTS idx_course_registrations_created_at ON public.course_registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_registrations_composite ON public.course_registrations(batch_id, status, created_at DESC);

-- 3. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.course_registrations;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.course_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable RLS and define policies (Keep existing policies for submit_course_registration)
ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;

-- 5. RPC: admin_get_batch_registrations
CREATE OR REPLACE FUNCTION public.admin_get_batch_registrations(p_batch_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Security check
  IF NOT public.is_admin_or_sub_admin(auth.uid()) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'batch_id', r.batch_id,
      'batch_slug', b.slug,
      'batch_title', b.title,
      'course_title', c.title,
      'full_name', r.full_name,
      'phone', r.phone,
      'email', r.email,
      'company', r.company,
      'participant_role', r.participant_role,
      'source', r.source,
      'note', r.note,
      'status', r.status,
      'admin_note', r.admin_note,
      'contacted_at', r.contacted_at,
      'confirmed_at', r.confirmed_at,
      'created_at', r.created_at,
      'updated_at', r.updated_at
    ) ORDER BY r.created_at DESC
  ), '[]'::jsonb)
  INTO v_result
  FROM public.course_registrations r
  LEFT JOIN public.course_batches b ON r.batch_id = b.id
  LEFT JOIN public.courses c ON b.course_id = c.id
  WHERE r.batch_id = p_batch_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_batch_registrations(uuid) TO authenticated;

-- 6. RPC: admin_update_registration_status
CREATE OR REPLACE FUNCTION public.admin_update_registration_status(
  p_registration_id uuid,
  p_status text,
  p_admin_note text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reg public.course_registrations%ROWTYPE;
BEGIN
  -- Security check
  IF NOT public.is_admin_or_sub_admin(auth.uid()) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  -- Validate status
  IF p_status NOT IN ('pending', 'contacted', 'confirmed', 'rejected', 'cancelled') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;

  -- Get existing record
  SELECT * INTO v_reg FROM public.course_registrations WHERE id = p_registration_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'REGISTRATION_NOT_FOUND');
  END IF;

  -- Update timestamps based on status
  IF p_status = 'contacted' AND v_reg.contacted_at IS NULL THEN
    v_reg.contacted_at := now();
  END IF;
  
  IF p_status = 'confirmed' AND v_reg.confirmed_at IS NULL THEN
    v_reg.confirmed_at := now();
  END IF;

  -- Execute update
  UPDATE public.course_registrations
  SET 
    status = p_status,
    admin_note = p_admin_note,
    contacted_at = v_reg.contacted_at,
    confirmed_at = v_reg.confirmed_at
  WHERE id = p_registration_id;

  RETURN jsonb_build_object(
    'ok', true,
    'registration_id', p_registration_id,
    'status', p_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_registration_status(uuid, text, text) TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
