-- Cập nhật RPC admin_get_course_batches để trả về thêm course_title và course_slug
-- Lưu ý: Bạn có thể cần điều chỉnh kiểu dữ liệu trong RETURNS TABLE cho khớp chính xác với schema hiện tại của bạn.

DROP FUNCTION IF EXISTS admin_get_course_batches();

CREATE OR REPLACE FUNCTION admin_get_course_batches()
RETURNS TABLE (
  id uuid,
  course_id uuid,
  title text,
  slug text,
  training_format text,
  max_participants int,
  registration_status text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  registration_opens_at timestamp with time zone,
  registration_closes_at timestamp with time zone,
  description text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  course_title text,
  course_slug text
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    cb.id,
    cb.course_id,
    cb.title,
    cb.slug,
    cb.training_format::text,
    cb.max_participants,
    cb.registration_status::text,
    cb.start_date,
    cb.end_date,
    cb.registration_opens_at,
    cb.registration_closes_at,
    cb.description,
    cb.created_at,
    cb.updated_at,
    c.title as course_title,
    c.slug as course_slug
  FROM public.course_batches cb
  LEFT JOIN public.courses c ON c.id = cb.course_id
  ORDER BY cb.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
