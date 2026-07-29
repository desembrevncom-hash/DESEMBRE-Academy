-- P3C.37 Admin Landing Page Manager for Academy Campaigns SQL Migration
-- Run on Supabase SQL Editor

-- ─── 1. Create Table public.academy_landing_pages ────────────────────────────
CREATE TABLE IF NOT EXISTS public.academy_landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  hero_badge text,
  hero_title text,
  hero_subtitle text,
  hero_cover_url text,
  primary_cta_label text DEFAULT 'Đăng ký lớp gần nhất',
  secondary_cta_label text DEFAULT 'Nhận tư vấn lộ trình',
  audience jsonb DEFAULT '[]'::jsonb,
  outcomes jsonb DEFAULT '[]'::jsonb,
  curriculum_fallback jsonb DEFAULT '[]'::jsonb,
  trust_items jsonb DEFAULT '[]'::jsonb,
  faqs jsonb DEFAULT '[]'::jsonb,
  seo_title text,
  seo_description text,
  og_image_url text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast slug lookup
CREATE INDEX IF NOT EXISTS idx_academy_landing_pages_slug ON public.academy_landing_pages (slug);
CREATE INDEX IF NOT EXISTS idx_academy_landing_pages_published ON public.academy_landing_pages (is_published);

-- ─── 2. Enable RLS & Configure Policies ──────────────────────────────────────
ALTER TABLE public.academy_landing_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view published landing pages" ON public.academy_landing_pages;
DROP POLICY IF EXISTS "Admins full management landing pages" ON public.academy_landing_pages;

-- Public read access for published landing pages
CREATE POLICY "Public can view published landing pages"
  ON public.academy_landing_pages
  FOR SELECT
  USING (is_published = true OR (auth.role() = 'authenticated' AND public.is_admin_or_sub_admin(auth.uid())));

-- Admin/Sub-admin full access
CREATE POLICY "Admins full management landing pages"
  ON public.academy_landing_pages
  FOR ALL
  USING (auth.role() = 'authenticated' AND public.is_admin_or_sub_admin(auth.uid()))
  WITH CHECK (auth.role() = 'authenticated' AND public.is_admin_or_sub_admin(auth.uid()));

-- ─── 3. Seed Initial SYNERGISTIC PROTOCOL Landing Page ───────────────────────
INSERT INTO public.academy_landing_pages (
  title,
  slug,
  course_id,
  hero_badge,
  hero_title,
  hero_subtitle,
  primary_cta_label,
  secondary_cta_label,
  audience,
  outcomes,
  curriculum_fallback,
  trust_items,
  faqs,
  seo_title,
  seo_description,
  is_published
)
SELECT 
  'SYNERGISTIC PROTOCOL',
  'synergistic-protocol',
  c.id,
  'DESEMBRE ACADEMY • KHÓA ĐÀO TẠO CHUYÊN SÂU',
  'SYNERGISTIC PROTOCOL',
  'Chuẩn hóa tư duy phối hợp hoạt chất, xây dựng protocol điều trị có hệ thống và ứng dụng thực tế trong chăm sóc da chuyên sâu.',
  'Đăng ký lớp gần nhất',
  'Nhận tư vấn lộ trình',
  '[
    {"title": "Chủ Spa / Clinic", "description": "Muốn chuẩn hóa quy trình dịch vụ, xây dựng phác đồ điều trị độc quyền và nâng tầm uy tín cơ sở."},
    {"title": "Kỹ thuật viên Spa", "description": "Cần nâng cấp tư duy chỉ định, làm chủ kỹ thuật phối hợp hoạt chất chuẩn Y Khoa và xử lý ca khó."},
    {"title": "Đội ngũ tư vấn", "description": "Muốn hiểu rõ cơ chế hoạt chất, giải thích logic phác đồ minh bạch để chốt liệu trình tự tin hơn."},
    {"title": "Đối tác DESEMBRE", "description": "Muốn tối ưu hóa hiệu quả mỹ phẩm DESEMBRE chính hãng, nâng cao tỷ lệ khách hàng quay lại."}
  ]'::jsonb,
  '[
    {"title": "Hiểu logic phối hợp hoạt chất", "description": "Nắm vững cơ chế cộng hưởng (synergy) giữa các nhóm dược mỹ phẩm trị liệu."},
    {"title": "Xây dựng protocol chuẩn hóa", "description": "Tự thiết kế phác đồ linh hoạt theo từng vấn đề da: sắc tố, mụn, lão hóa, phục hồi."},
    {"title": "Tránh kích ứng & tác dụng phụ", "description": "Nhận biết các cặp hoạt chất xung đột để phòng tránh bùng mụn hoặc tổn thương hàng rào da."},
    {"title": "Tối ưu hóa hiệu quả liệu trình", "description": "Rút ngắn thời gian điều trị cho khách hàng và tăng tỷ lệ cải thiện lâm sàng."},
    {"title": "Tư vấn khách hàng tự tin", "description": "Giải thích cơ chế liệu trình chuyên nghiệp, tăng niềm tin và sự hài lòng của khách."},
    {"title": "Ứng dụng ngay vào Spa / Clinic", "description": "Chuyển giao và triển khai ngay vào bảng menu dịch vụ để bứt phá doanh thu."}
  ]'::jsonb,
  '[
    {"session": "Buổi 1", "title": "Nền tảng SYNERGISTIC PROTOCOL", "description": "Tổng quan về nguyên lý phối hợp hoạt chất và cơ chế tác động đa tầng trên hàng rào da."},
    {"session": "Buổi 2", "title": "Phân tích tình trạng da & Chỉ định", "description": "Nhận diện tổn thương lâm sàng: mụn, thâm sắc tố, lão hóa và lựa chọn nhóm hoạt chất tương thích."},
    {"session": "Buổi 3", "title": "Xây dựng phác đồ phối hợp hoạt chất", "description": "Thực hành kết hợp các dòng sản phẩm DESEMBRE cao cấp theo chuẩn quy trình y khoa."},
    {"session": "Buổi 4", "title": "Case study & Xử lý tình huống thực tế", "description": "Phân tích các ca lâm sàng phức tạp, giải đáp thắc mắc và chuyển giao quy trình cho Spa/Clinic."}
  ]'::jsonb,
  '[
    {"title": "Chuẩn hóa tư vấn & chỉ định", "description": "Tự tin giải thích cơ chế phối hợp hoạt chất, giúp khách hàng hiểu rõ giá trị liệu trình và an tâm trị liệu.", "badge": "Chuẩn Y Khoa"},
    {"title": "Tối ưu hiệu quả liệu trình", "description": "Áp dụng phác đồ chuẩn Hàn Quốc giúp rút ngắn thời gian điều trị và nâng cao tỷ lệ hài lòng của khách hàng.", "badge": "Nâng tầm Spa"},
    {"title": "Đồng hành & Hỗ trợ triển khai", "description": "Được hỗ trợ trực tiếp bởi chuyên gia đào tạo DESEMBRE Academy trong việc chuyển giao quy trình cho nhân sự.", "badge": "Hỗ trợ 24/7"}
  ]'::jsonb,
  '[
    {"q": "Khóa học phù hợp với người mới bắt đầu không?", "a": "Khóa học được thiết kế có hệ thống từ tư duy nền tảng đến ứng dụng nâng cao, do đó cả người mới vào nghề lẫn KTV/Chủ Spa lâu năm đều dễ dàng tiếp thu và chuẩn hóa phác đồ."},
    {"q": "Có bắt buộc phải đang sử dụng mỹ phẩm DESEMBRE tại Spa không?", "a": "Không bắt buộc. Tư duy phối hợp hoạt chất (Synergistic Protocol) mang tính ứng dụng tổng quan trong da liễu thẩm mỹ. Tuy nhiên, việc áp dụng trên dòng sản phẩm DESEMBRE chính hãng sẽ giúp tối ưu hóa hiệu quả thực tế nhanh nhất."},
    {"q": "Học theo hình thức Online có được cấp tài liệu chuẩn không?", "a": "Có. Tất cả học viên đăng ký tham gia đều được cấp bộ tài liệu bài giảng e-book và file sơ đồ phác đồ chuẩn hóa do DESEMBRE Academy biên soạn."},
    {"q": "Sau khi gửi đăng ký trên website, bao lâu sẽ nhận được xác nhận?", "a": "Tư vấn viên của DESEMBRE Academy sẽ liên hệ trực tiếp qua Zalo / Số điện thoại trong vòng 24 giờ làm việc để xác nhận thông tin và hướng dẫn xếp lớp."},
    {"q": "Sau khóa học có được hỗ trợ tư vấn phác đồ khi gặp ca khó không?", "a": "Có. Học viên sẽ được tham gia nhóm Zalo hỗ trợ chuyên môn trực tiếp cùng đội ngũ giảng viên và chuyên gia đào tạo DESEMBRE Academy."}
  ]'::jsonb,
  'SYNERGISTIC PROTOCOL | Khóa đào tạo protocol chuyên sâu | DESEMBRE Academy',
  'Đăng ký khóa SYNERGISTIC PROTOCOL cùng DESEMBRE Academy. Chương trình giúp chuẩn hóa tư duy phối hợp hoạt chất, xây dựng protocol và ứng dụng thực tế trong spa/clinic.',
  true
FROM public.courses c
WHERE c.slug = 'chuyen-de-synergistic-protocol-online' OR c.title ILIKE '%synergistic protocol%'
LIMIT 1
ON CONFLICT (slug) DO UPDATE
SET is_published = true, updated_at = now();
