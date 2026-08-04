-- ====================================================================
-- P3C.65L — Queue Student Login OTP ZNS Delivery
-- File: scratch/p3c65l_queue_student_login_otp_zns.sql
-- ====================================================================

-- 1. DB table update on student_login_otps
ALTER TABLE public.student_login_otps ADD COLUMN IF NOT EXISTS delivery_channel text DEFAULT 'zns';
ALTER TABLE public.student_login_otps ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'queued';
ALTER TABLE public.student_login_otps ADD COLUMN IF NOT EXISTS delivered_at timestamptz NULL;
ALTER TABLE public.student_login_otps ADD COLUMN IF NOT EXISTS provider_message_id text NULL;
ALTER TABLE public.student_login_otps ADD COLUMN IF NOT EXISTS error_message text NULL;

-- 2. Update create_student_login_otp(p_phone text) SECURITY DEFINER RPC
CREATE OR REPLACE FUNCTION public.create_student_login_otp(
  p_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_phone_digits text;
  v_phone_e164 text;
  v_phone_local text;
  v_check_res jsonb;
  v_otp text;
  v_otp_hash text;
  v_otp_id uuid;
  v_outbox_id uuid;
BEGIN
  IF p_phone IS NULL OR trim(p_phone) = '' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'INVALID_PHONE');
  END IF;

  v_phone_digits := regexp_replace(p_phone, '[^\d]', '', 'g');
  IF length(v_phone_digits) < 8 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'INVALID_PHONE_DIGITS');
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

  -- Check student eligibility via RPC
  v_check_res := public.check_student_phone_access(p_phone);
  IF v_check_res IS NULL OR (v_check_res->>'ok')::boolean IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'message', 'NOT_ELIGIBLE');
  END IF;

  -- ALWAYS generate secure random 6-digit OTP
  v_otp := lpad((floor(random() * 900000) + 100000)::text, 6, '0');

  -- Hash OTP with SHA256 (encode(digest(...)))
  v_otp_hash := encode(digest(v_otp, 'sha256'), 'hex');

  -- 1. Insert into student_login_otps (stores otp_hash only)
  INSERT INTO public.student_login_otps (
    phone,
    phone_e164,
    otp_hash,
    purpose,
    delivery_channel,
    delivery_status,
    expires_at,
    created_at
  ) VALUES (
    v_phone_local,
    v_phone_e164,
    v_otp_hash,
    'student_login',
    'zns',
    'queued',
    now() + interval '5 minutes',
    now()
  )
  RETURNING id INTO v_otp_id;

  -- 2. Insert into notification_outbox for ZNS Delivery
  BEGIN
    INSERT INTO public.notification_outbox (
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
      'zalo_zns',
      'student_login_otp',
      'oa_desembre',
      jsonb_build_object(
        'customer_name', 'Học viên DESEMBRE',
        'full_name', 'Học viên DESEMBRE',
        'phone', v_phone_local,
        'phone_e164', v_phone_e164,
        'otp_code', v_otp,
        'expire_minutes', '5',
        'otp_id', v_otp_id
      ),
      'queued',
      0,
      3,
      now(),
      now(),
      now()
    )
    RETURNING id INTO v_outbox_id;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'OTP_DELIVERY_QUEUE_FAILED',
      'message', 'Không thể khởi tạo hàng đợi gửi OTP ZNS.'
    );
  END;

  -- Never return raw_otp to client in response
  RETURN jsonb_build_object(
    'ok', true,
    'phone_e164', v_phone_e164,
    'otp_id', v_otp_id,
    'outbox_id', v_outbox_id,
    'message', 'Mã OTP đã được gửi qua Zalo/SMS.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_student_login_otp(text) TO anon, authenticated, service_role, postgres;

NOTIFY pgrst, 'reload schema';
