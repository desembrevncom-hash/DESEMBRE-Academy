-- =========================================================================
-- P3C.65C — Paid Flow DB Alignment & ON CONFLICT Hotfix SQL Migration
-- =========================================================================

-- 1. Add price & payment columns to public.courses
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS price_amount numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_amount numeric(12,2) NULL,
ADD COLUMN IF NOT EXISTS price_currency text DEFAULT 'VND',
ADD COLUMN IF NOT EXISTS payment_note text NULL;

-- 2. Fix ON CONFLICT unique indexes

-- Unique index for notification_outbox (registration_id, channel, template_code)
DROP INDEX IF EXISTS public.uq_notification_outbox_reg_chan_tpl;
CREATE UNIQUE INDEX uq_notification_outbox_reg_chan_tpl 
ON public.notification_outbox (registration_id, channel, template_code) 
WHERE registration_id IS NOT NULL;

-- Unique index for student_course_access (course_id, phone_e164)
DROP INDEX IF EXISTS public.uq_student_course_access_course_phone;
CREATE UNIQUE INDEX uq_student_course_access_course_phone 
ON public.student_course_access (course_id, phone_e164);

-- Unique index for student_course_access (course_id, batch_id, phone_e164) with COALESCE fallback
DROP INDEX IF EXISTS public.uq_student_course_access_course_batch_phone;
CREATE UNIQUE INDEX uq_student_course_access_course_batch_phone 
ON public.student_course_access (
  course_id, 
  COALESCE(batch_id, '00000000-0000-0000-0000-000000000000'::uuid), 
  phone_e164
);

-- 3. Grants & RLS
GRANT ALL ON public.courses TO service_role, postgres, anon, authenticated;
GRANT ALL ON public.student_course_access TO service_role, postgres, anon, authenticated;
GRANT ALL ON public.academy_orders TO service_role, postgres, anon, authenticated;
GRANT ALL ON public.notification_outbox TO service_role, postgres, anon, authenticated;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
