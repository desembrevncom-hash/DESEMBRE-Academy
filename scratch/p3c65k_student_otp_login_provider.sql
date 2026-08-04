-- ====================================================================
-- P3C.65K-SECURITY — Safe Production Student OTP Login Provider
-- File: scratch/p3c65k_student_otp_login_provider.sql
-- ====================================================================

-- 1. Create table public.student_login_otps
CREATE TABLE IF NOT EXISTS public.student_login_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text,
  phone_e164 text NOT NULL,
  otp_hash text NOT NULL,
  purpose text DEFAULT 'student_login',
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NULL,
  attempt_count int DEFAULT 0,
  max_attempts int DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_otps_phone_e164 ON public.student_login_otps(phone_e164);
CREATE INDEX IF NOT EXISTS idx_student_otps_expires ON public.student_login_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_student_otps_consumed ON public.student_login_otps(consumed_at);

-- 2. DROP any previous function signatures with p_is_dev boolean flag
DROP FUNCTION IF EXISTS public.create_student_login_otp(text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.create_student_login_otp(text) CASCADE;

-- 3. CREATE SAFE PRODUCTION SECURITY DEFINER RPC: create_student_login_otp(p_phone)
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

  -- ALWAYS generate secure random 6-digit OTP in Production
  v_otp := lpad((floor(random() * 900000) + 100000)::text, 6, '0');

  -- Hash OTP with SHA256 (encode(digest(...)))
  v_otp_hash := encode(digest(v_otp, 'sha256'), 'hex');

  -- Insert into student_login_otps
  INSERT INTO public.student_login_otps (
    phone,
    phone_e164,
    otp_hash,
    purpose,
    expires_at,
    created_at
  ) VALUES (
    v_phone_local,
    v_phone_e164,
    v_otp_hash,
    'student_login',
    now() + interval '5 minutes',
    now()
  )
  RETURNING id INTO v_otp_id;

  -- Never return raw_otp to client
  RETURN jsonb_build_object(
    'ok', true,
    'phone_e164', v_phone_e164,
    'otp_id', v_otp_id,
    'message', 'OTP_CREATED'
  );
END;
$$;

-- 4. CREATE SECURITY DEFINER RPC: verify_student_login_otp(p_phone, p_otp)
DROP FUNCTION IF EXISTS public.verify_student_login_otp(text, text) CASCADE;

CREATE OR REPLACE FUNCTION public.verify_student_login_otp(
  p_phone text,
  p_otp text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_phone_digits text;
  v_phone_e164 text;
  v_otp_hash text;
  v_otp_rec RECORD;
  v_check_res jsonb;
BEGIN
  IF p_phone IS NULL OR p_otp IS NULL OR trim(p_otp) = '' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'INVALID_INPUT');
  END IF;

  v_phone_digits := regexp_replace(p_phone, '[^\d]', '', 'g');
  IF v_phone_digits LIKE '84%' THEN
    v_phone_e164 := '+' || v_phone_digits;
  ELSIF v_phone_digits LIKE '0%' THEN
    v_phone_e164 := '+84' || substr(v_phone_digits, 2);
  ELSE
    v_phone_e164 := '+84' || v_phone_digits;
  END IF;

  v_otp_hash := encode(digest(trim(p_otp), 'sha256'), 'hex');

  -- Find latest unconsumed OTP record for this phone_e164 within expiry
  SELECT * INTO v_otp_rec
  FROM public.student_login_otps
  WHERE phone_e164 = v_phone_e164
    AND consumed_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_otp_rec.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'EXPIRED_OR_NOT_FOUND');
  END IF;

  IF v_otp_rec.attempt_count >= v_otp_rec.max_attempts THEN
    RETURN jsonb_build_object('ok', false, 'message', 'MAX_ATTEMPTS_EXCEEDED');
  END IF;

  -- Check OTP hash match
  IF v_otp_rec.otp_hash <> v_otp_hash THEN
    UPDATE public.student_login_otps
    SET attempt_count = attempt_count + 1
    WHERE id = v_otp_rec.id;

    RETURN jsonb_build_object(
      'ok', false,
      'message', 'INCORRECT_OTP',
      'remaining_attempts', (v_otp_rec.max_attempts - (v_otp_rec.attempt_count + 1))
    );
  END IF;

  -- Correct OTP! Mark consumed
  UPDATE public.student_login_otps
  SET consumed_at = now()
  WHERE id = v_otp_rec.id;

  -- Fetch student courses info via check_student_phone_access
  v_check_res := public.check_student_phone_access(p_phone);

  RETURN jsonb_build_object(
    'ok', true,
    'phone_e164', v_phone_e164,
    'courses', coalesce(v_check_res->'courses', '[]'::jsonb),
    'message', 'OTP_VERIFIED_SUCCESS'
  );
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.create_student_login_otp(text) TO anon, authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.verify_student_login_otp(text, text) TO anon, authenticated, service_role, postgres;

NOTIFY pgrst, 'reload schema';
