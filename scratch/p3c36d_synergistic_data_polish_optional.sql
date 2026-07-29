-- P3C.36D — SYNERGISTIC PROTOCOL Optional Data Polish SQL
-- RUN ONLY IF YOU WANT TO CLEAN UP DEMO/TYPO DATA FOR SYNERGISTIC PROTOCOL

-- ─── 1. Fix Typo in Batch Title (e.g., "Khóa 1 ONILNE THÁNG 8" -> "Khóa 1 ONLINE THÁNG 8") ───
UPDATE public.course_batches
SET title = REPLACE(title, 'ONILNE', 'ONLINE')
WHERE title ILIKE '%ONILNE%';

-- ─── 2. Set Default max_participants = 30 for Open Batches if NULL ───────────
UPDATE public.course_batches
SET max_participants = 30
WHERE max_participants IS NULL
  AND LOWER(TRIM(COALESCE(registration_status, status))) = 'open'
  AND course_id IN (
    SELECT id FROM public.courses 
    WHERE slug = 'chuyen-de-synergistic-protocol-online' OR title ILIKE '%synergistic protocol%'
  );

-- ─── 3. Set Course Summary if NULL ───────────────────────────────────────────
UPDATE public.courses
SET summary = 'Chương trình đào tạo chuyên sâu giúp chuẩn hóa protocol, nâng cao tư duy chỉ định và ứng dụng thực tế trong điều trị da chuẩn Y Khoa.'
WHERE (summary IS NULL OR summary = '')
  AND (slug = 'chuyen-de-synergistic-protocol-online' OR title ILIKE '%synergistic protocol%');

-- ─── 4. Set Default Registration Close Date (e.g., 2026-08-03 23:59:59+07) if NULL ───
UPDATE public.course_batches
SET registration_closes_at = '2026-08-03 23:59:59+07'
WHERE registration_closes_at IS NULL
  AND LOWER(TRIM(COALESCE(registration_status, status))) = 'open'
  AND course_id IN (
    SELECT id FROM public.courses 
    WHERE slug = 'chuyen-de-synergistic-protocol-online' OR title ILIKE '%synergistic protocol%'
  );
