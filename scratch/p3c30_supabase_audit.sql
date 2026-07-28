-- =================================================================================
-- P3C.30 - SUPABASE AUDIT SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR TO VERIFY PRODUCTION READINESS
-- =================================================================================

-- 1. VERIFY TABLES EXIST
DO $$
DECLARE
  table_list text[] := ARRAY[
    'courses',
    'course_batches',
    'course_sessions',
    'course_registrations',
    'notification_outbox',
    'academy_instructors',
    'registration_status_history',
    'course_session_attendance'
  ];
  tbl text;
  missing_tables text[] := ARRAY[]::text[];
BEGIN
  FOREACH tbl IN ARRAY table_list
  LOOP
    IF NOT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = tbl
    ) THEN
      missing_tables := array_append(missing_tables, tbl);
    END IF;
  END LOOP;

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE NOTICE '❌ MISSING TABLES: %', missing_tables;
  ELSE
    RAISE NOTICE '✅ ALL CRITICAL TABLES EXIST.';
  END IF;
END $$;


-- 2. VERIFY RPCS EXIST
DO $$
DECLARE
  rpc_list text[] := ARRAY[
    'public_get_training_schedule',
    'public_submit_course_registration',
    'public_get_course_detail',
    'public_get_instructor_profile',
    'admin_get_all_course_registrations',
    'admin_update_course_registration_status',
    'admin_update_registration_follow_up',
    'admin_get_calendar'
  ];
  rpc_name text;
  missing_rpcs text[] := ARRAY[]::text[];
BEGIN
  FOREACH rpc_name IN ARRAY rpc_list
  LOOP
    IF NOT EXISTS (
      SELECT FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = rpc_name
    ) THEN
      missing_rpcs := array_append(missing_rpcs, rpc_name);
    END IF;
  END LOOP;

  IF array_length(missing_rpcs, 1) > 0 THEN
    RAISE NOTICE '❌ MISSING RPCS: %', missing_rpcs;
  ELSE
    RAISE NOTICE '✅ ALL CRITICAL RPCS EXIST.';
  END IF;
END $$;


-- 3. VERIFY GRANT EXECUTE
-- Check if anon and authenticated have execute access to public_submit_course_registration
DO $$
DECLARE
  has_grant boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routine_privileges 
    WHERE routine_schema = 'public' 
    AND routine_name = 'public_submit_course_registration'
    AND grantee IN ('anon', 'authenticated', 'PUBLIC')
  ) INTO has_grant;

  IF has_grant THEN
    RAISE NOTICE '✅ GRANT EXECUTE IS CONFIGURED FOR PUBLIC RPCS.';
  ELSE
    RAISE NOTICE '❌ MISSING GRANT EXECUTE FOR PUBLIC RPCS.';
  END IF;
END $$;

-- 4. VERIFY RLS POLICIES (Basic Check)
DO $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'course_registrations' AND relnamespace = 'public'::regnamespace;

  IF rls_enabled THEN
    RAISE NOTICE '✅ RLS IS ENABLED ON course_registrations.';
  ELSE
    RAISE NOTICE '❌ RLS IS NOT ENABLED ON course_registrations (DANGER).';
  END IF;
END $$;
