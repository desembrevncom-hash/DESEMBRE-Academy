-- =========================================================================
-- P3C.65 — Paid Course Access & Manual Payment Confirmation SQL Migration
-- =========================================================================

-- 1. Table: public.academy_orders
CREATE TABLE IF NOT EXISTS public.academy_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NULL REFERENCES public.course_registrations(id) ON DELETE SET NULL,
  course_id uuid NULL REFERENCES public.courses(id) ON DELETE SET NULL,
  batch_id uuid NULL REFERENCES public.course_batches(id) ON DELETE SET NULL,
  full_name text,
  phone text NOT NULL,
  phone_e164 text,
  email text NULL,
  amount numeric(12,2) DEFAULT 0,
  currency text DEFAULT 'VND',
  payment_method text DEFAULT 'bank_transfer',
  payment_status text DEFAULT 'pending_payment', -- pending_payment, paid, failed, cancelled, refunded
  payment_note text NULL,
  bank_transfer_content text NULL,
  proof_url text NULL,
  paid_at timestamptz NULL,
  confirmed_by uuid NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Table: public.student_course_access
CREATE TABLE IF NOT EXISTS public.student_course_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NULL REFERENCES public.academy_orders(id) ON DELETE SET NULL,
  registration_id uuid NULL REFERENCES public.course_registrations(id) ON DELETE SET NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  batch_id uuid NULL REFERENCES public.course_batches(id) ON DELETE SET NULL,
  phone text NOT NULL,
  phone_e164 text,
  access_status text DEFAULT 'active', -- active, expired, revoked
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_student_course_access_phone_e164 ON public.student_course_access(phone_e164);
CREATE INDEX IF NOT EXISTS idx_student_course_access_course_id ON public.student_course_access(course_id);
CREATE INDEX IF NOT EXISTS idx_academy_orders_phone_e164 ON public.academy_orders(phone_e164);
CREATE INDEX IF NOT EXISTS idx_academy_orders_payment_status ON public.academy_orders(payment_status);

-- 4. Enable RLS & Grants
ALTER TABLE public.academy_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_course_access ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.academy_orders TO service_role, postgres, anon, authenticated;
GRANT ALL ON public.student_course_access TO service_role, postgres, anon, authenticated;

-- Policies for public and authenticated access
DROP POLICY IF EXISTS "Allow public insert on academy_orders" ON public.academy_orders;
CREATE POLICY "Allow public insert on academy_orders" ON public.academy_orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on academy_orders" ON public.academy_orders;
CREATE POLICY "Allow public select on academy_orders" ON public.academy_orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin update on academy_orders" ON public.academy_orders;
CREATE POLICY "Allow admin update on academy_orders" ON public.academy_orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public select on student_course_access" ON public.student_course_access;
CREATE POLICY "Allow public select on student_course_access" ON public.student_course_access FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin insert/update on student_course_access" ON public.student_course_access;
CREATE POLICY "Allow admin insert/update on student_course_access" ON public.student_course_access FOR ALL USING (true);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
