-- =========================================================================
-- P3C.65G — Move Admin Paid Confirmation Into SECURITY DEFINER RPC
-- =========================================================================

CREATE OR REPLACE FUNCTION public.admin_confirm_paid_and_open_access(
  p_registration_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reg RECORD;
  v_batch RECORD;
  v_course RECORD;
  v_course_id uuid;
  v_phone_raw text;
  v_phone_digits text;
  v_phone_e164 text;
  v_phone_local text;
  v_effective_amount numeric(12,2) := 300000;
  v_order_id uuid;
  v_access_id uuid;
BEGIN
  -- 1. Fetch registration row
  SELECT * INTO v_reg
  FROM public.course_registrations
  WHERE id = p_registration_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message', 'Đơn đăng ký không tồn tại trong hệ thống.'
    );
  END IF;

  v_phone_raw := COALESCE(v_reg.phone, '');
  v_phone_digits := regexp_replace(v_phone_raw, '[^\d]', '', 'g');

  IF length(v_phone_digits) < 8 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message', 'Số điện thoại đăng ký không hợp lệ.'
    );
  END IF;

  -- Compute normalized phone formats
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

  -- 2. Derive course_id from batch_id
  IF v_reg.batch_id IS NOT NULL THEN
    SELECT course_id INTO v_course_id
    FROM public.course_batches
    WHERE id = v_reg.batch_id;
  END IF;

  IF v_course_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message', 'Không thể xác định khóa học từ lớp đăng ký (batch_id).'
    );
  END IF;

  -- Fetch course pricing
  SELECT price_amount, deposit_amount INTO v_course
  FROM public.courses
  WHERE id = v_course_id;

  IF v_course.deposit_amount IS NOT NULL AND v_course.deposit_amount > 0 THEN
    v_effective_amount := v_course.deposit_amount;
  ELSIF v_course.price_amount IS NOT NULL AND v_course.price_amount > 0 THEN
    v_effective_amount := v_course.price_amount;
  END IF;

  -- 3. Upsert / Create academy_orders
  SELECT id INTO v_order_id
  FROM public.academy_orders
  WHERE registration_id = p_registration_id
  LIMIT 1;

  IF v_order_id IS NOT NULL THEN
    UPDATE public.academy_orders
    SET 
      payment_status = 'paid',
      paid_at = now(),
      updated_at = now()
    WHERE id = v_order_id;
  ELSE
    INSERT INTO public.academy_orders (
      registration_id,
      course_id,
      batch_id,
      full_name,
      phone,
      phone_e164,
      email,
      amount,
      payment_method,
      payment_status,
      bank_transfer_content,
      paid_at,
      created_at,
      updated_at
    ) VALUES (
      p_registration_id,
      v_course_id,
      v_reg.batch_id,
      COALESCE(v_reg.full_name, 'Học viên'),
      v_phone_local,
      v_phone_e164,
      v_reg.email,
      v_effective_amount,
      'bank_transfer',
      'paid',
      'DESEMBRE ' || regexp_replace(v_phone_local, '[^\d]', '', 'g'),
      now(),
      now(),
      now()
    )
    RETURNING id INTO v_order_id;
  END IF;

  -- 4. Update course_registrations status = 'paid'
  UPDATE public.course_registrations
  SET 
    status = 'paid',
    updated_at = now()
  WHERE id = p_registration_id;

  -- 5. Upsert student_course_access active
  INSERT INTO public.student_course_access (
    order_id,
    registration_id,
    course_id,
    batch_id,
    phone,
    phone_e164,
    access_status,
    starts_at,
    created_at,
    updated_at
  ) VALUES (
    v_order_id,
    p_registration_id,
    v_course_id,
    v_reg.batch_id,
    v_phone_local,
    v_phone_e164,
    'active',
    now(),
    now(),
    now()
  )
  ON CONFLICT (course_id, phone_e164) DO UPDATE
  SET 
    access_status = 'active',
    order_id = EXCLUDED.order_id,
    registration_id = EXCLUDED.registration_id,
    batch_id = COALESCE(EXCLUDED.batch_id, student_course_access.batch_id),
    updated_at = now()
  RETURNING id INTO v_access_id;

  IF v_access_id IS NULL THEN
    -- Fallback fetch if ON CONFLICT update didn't trigger RETURNING in edge cases
    SELECT id INTO v_access_id
    FROM public.student_course_access
    WHERE course_id = v_course_id AND phone_e164 = v_phone_e164
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'access_id', v_access_id,
    'registration_id', p_registration_id,
    'course_id', v_course_id,
    'phone_e164', v_phone_e164,
    'message', 'Đã xác nhận thanh toán & mở quyền học viên thành công!'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'ok', false,
    'message', SQLERRM
  );
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.admin_confirm_paid_and_open_access(uuid) TO authenticated, anon, service_role, postgres;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
