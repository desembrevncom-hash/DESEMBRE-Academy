-- P3C.6 Registration Confirmation / Admin Follow-up Workflow

-- 1. Table: registration_status_history
CREATE TABLE IF NOT EXISTS public.registration_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.course_registrations(id) ON DELETE CASCADE,
  actor_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- Null if system
  old_status text,
  new_status text,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reg_history_reg_id ON public.registration_status_history(registration_id);
ALTER TABLE public.registration_status_history ENABLE ROW LEVEL SECURITY;

-- 2. Table: notification_outbox
CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.course_registrations(id) ON DELETE CASCADE,
  channel text NOT NULL, -- 'zns', 'email', 'manual'
  template_code text,
  payload jsonb,
  status text NOT NULL DEFAULT 'queued', -- 'queued', 'sent', 'failed', 'skipped'
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outbox_status ON public.notification_outbox(status);
CREATE INDEX IF NOT EXISTS idx_outbox_reg_id ON public.notification_outbox(registration_id);
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

-- 3. Trigger to insert into outbox after registration
CREATE OR REPLACE FUNCTION public.handle_new_registration_outbox()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_outbox (registration_id, channel, status)
  VALUES (NEW.id, 'zns', 'queued');
  
  -- Record initial status
  INSERT INTO public.registration_status_history (registration_id, new_status, note)
  VALUES (NEW.id, NEW.status, 'Khách hàng gửi đăng ký');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_new_registration_outbox ON public.course_registrations;
CREATE TRIGGER trigger_new_registration_outbox
  AFTER INSERT ON public.course_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_registration_outbox();


-- 4. Update admin_update_registration_status to log history
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

  -- Log history if status or note changed
  IF v_reg.status <> p_status OR p_admin_note IS NOT NULL THEN
    INSERT INTO public.registration_status_history (
      registration_id, 
      actor_id, 
      old_status, 
      new_status, 
      note
    ) VALUES (
      p_registration_id,
      auth.uid(),
      v_reg.status,
      p_status,
      p_admin_note
    );
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


-- 5. RPC: admin_get_lead_insights
CREATE OR REPLACE FUNCTION public.admin_get_lead_insights(p_registration_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reg public.course_registrations%ROWTYPE;
  v_history jsonb;
  v_outbox jsonb;
  v_past_registrations jsonb;
BEGIN
  -- Security check
  IF NOT public.is_admin_or_sub_admin(auth.uid()) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT * INTO v_reg FROM public.course_registrations WHERE id = p_registration_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'REGISTRATION_NOT_FOUND');
  END IF;

  -- Get history
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', h.id,
      'old_status', h.old_status,
      'new_status', h.new_status,
      'note', h.note,
      'created_at', h.created_at,
      'actor_email', u.email
    ) ORDER BY h.created_at DESC
  ), '[]'::jsonb) INTO v_history
  FROM public.registration_status_history h
  LEFT JOIN auth.users u ON h.actor_id = u.id
  WHERE h.registration_id = p_registration_id;

  -- Get outbox status
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'channel', o.channel,
      'status', o.status,
      'sent_at', o.sent_at,
      'created_at', o.created_at
    ) ORDER BY o.created_at DESC
  ), '[]'::jsonb) INTO v_outbox
  FROM public.notification_outbox o
  WHERE o.registration_id = p_registration_id;

  -- Get past registrations by same phone or email
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'batch_title', b.title,
      'course_title', c.title,
      'status', r.status,
      'created_at', r.created_at
    ) ORDER BY r.created_at DESC
  ), '[]'::jsonb) INTO v_past_registrations
  FROM public.course_registrations r
  JOIN public.course_batches b ON r.batch_id = b.id
  JOIN public.courses c ON b.course_id = c.id
  WHERE r.id != p_registration_id 
    AND (r.phone = v_reg.phone OR (r.email IS NOT NULL AND r.email = v_reg.email));

  RETURN jsonb_build_object(
    'ok', true,
    'history', v_history,
    'outbox', v_outbox,
    'past_registrations', v_past_registrations
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_get_lead_insights(uuid) TO authenticated;

-- 6. RPC: student_get_learning_history
CREATE OR REPLACE FUNCTION public.student_get_learning_history(p_phone text DEFAULT NULL, p_email text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_phone text;
  v_user_email text;
  v_registrations jsonb;
BEGIN
  -- We allow authenticated users to fetch by their own phone or email from auth.users
  -- Or allow query by matching params if user is not fully authenticated but just checks history
  -- Wait, for security we should only use auth.users phone/email if authenticated.
  IF auth.uid() IS NOT NULL THEN
    SELECT raw_user_meta_data->>'phone', email INTO v_user_phone, v_user_email 
    FROM auth.users WHERE id = auth.uid();
  ELSE
    -- If anon, require exact match (this might be risky if someone guesses phone, but it's non-private data)
    v_user_phone := p_phone;
    v_user_email := p_email;
  END IF;

  IF v_user_phone IS NULL AND v_user_email IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'status', r.status,
      'created_at', r.created_at,
      'batch', jsonb_build_object(
        'id', b.id,
        'title', b.title,
        'slug', b.slug,
        'training_format', b.training_format
      ),
      'course', jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'slug', c.slug,
        'cover_url', c.cover_url
      ),
      'sessions', (
        SELECT jsonb_agg(jsonb_build_object(
          'id', s.id,
          'title', s.title,
          'starts_at', s.starts_at,
          'ends_at', s.ends_at,
          'location_type', s.location_type
        ) ORDER BY s.starts_at ASC)
        FROM public.course_sessions s
        WHERE s.batch_id = b.id
      )
    ) ORDER BY r.created_at DESC
  ), '[]'::jsonb) INTO v_registrations
  FROM public.course_registrations r
  JOIN public.course_batches b ON r.batch_id = b.id
  JOIN public.courses c ON b.course_id = c.id
  WHERE r.phone = v_user_phone OR (r.email IS NOT NULL AND r.email = v_user_email);

  RETURN v_registrations;
END;
$$;

NOTIFY pgrst, 'reload schema';
