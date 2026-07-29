-- P3C.32C Supabase Environment & Schedule Debug Query
-- File: scratch/p3c32c_debug_training_schedule_env.sql

-- 1. Database environment check
select current_database(), current_schema(), now();

-- 2. Check total course_batches count
select count(*) as total_batches from public.course_batches;

-- 3. List recent 20 course_batches
select id, title, slug, registration_status, status, created_at from public.course_batches order by created_at desc limit 20;

-- 4. Check public_get_training_schedule RPC output count and payload
select jsonb_array_length(public.public_get_training_schedule()) as batch_count, public.public_get_training_schedule() as schedule_data;
