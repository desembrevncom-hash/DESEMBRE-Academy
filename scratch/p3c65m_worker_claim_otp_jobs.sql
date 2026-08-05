-- ====================================================================
-- P3C.65M — Ensure worker_claim_notification_jobs handles OTP jobs (registration_id IS NULL)
-- File: scratch/p3c65m_worker_claim_otp_jobs.sql
-- ====================================================================

CREATE OR REPLACE FUNCTION public.worker_claim_notification_jobs(
  p_worker_id text,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  registration_id uuid,
  channel text,
  template_code text,
  sender_key text,
  payload jsonb,
  attempt_count int,
  max_attempts int,
  phone text,
  lead_name text,
  lead_phone text,
  full_name text,
  course_title text,
  batch_title text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    UPDATE public.notification_outbox n
    SET 
      status = 'processing',
      updated_at = now()
    WHERE n.id IN (
      SELECT o.id
      FROM public.notification_outbox o
      WHERE o.status = 'queued'
        AND o.next_attempt_at <= now()
      ORDER BY o.created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT p_limit
    )
    RETURNING n.*
  )
  SELECT 
    c.id,
    c.registration_id,
    c.channel,
    c.template_code,
    c.sender_key,
    c.payload,
    c.attempt_count,
    c.max_attempts,
    COALESCE(c.payload->>'phone_e164', c.payload->>'phone', r.phone) AS phone,
    COALESCE(c.payload->>'customer_name', c.payload->>'full_name', r.full_name) AS lead_name,
    r.phone AS lead_phone,
    COALESCE(c.payload->>'full_name', r.full_name) AS full_name,
    crs.title AS course_title,
    b.title AS batch_title
  FROM claimed c
  LEFT JOIN public.course_registrations r ON r.id = c.registration_id
  LEFT JOIN public.course_batches b ON b.id = r.batch_id
  LEFT JOIN public.courses crs ON crs.id = b.course_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.worker_claim_notification_jobs(text, int) TO anon, authenticated, service_role, postgres;

NOTIFY pgrst, 'reload schema';
