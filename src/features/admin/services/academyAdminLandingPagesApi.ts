import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface LandingAudienceItem {
  title: string;
  description: string;
}

export interface LandingOutcomeItem {
  title: string;
  description: string;
}

export interface LandingCurriculumItem {
  session: string;
  title: string;
  description: string;
}

export interface LandingTrustItem {
  title: string;
  description: string;
  badge?: string;
}

export interface LandingFaqItem {
  q: string;
  a: string;
}

export interface AcademyLandingPage {
  id: string;
  title: string;
  slug: string;
  course_id: string | null;
  hero_badge: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_cover_url: string | null;
  primary_cta_label: string | null;
  secondary_cta_label: string | null;
  audience: LandingAudienceItem[];
  outcomes: LandingOutcomeItem[];
  curriculum_fallback: LandingCurriculumItem[];
  trust_items: LandingTrustItem[];
  faqs: LandingFaqItem[];
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  course?: {
    id: string;
    title: string;
    slug: string;
    cover_url: string | null;
  } | null;
}

export interface CreateLandingPagePayload {
  title: string;
  slug: string;
  course_id?: string | null;
  hero_badge?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_cover_url?: string | null;
  primary_cta_label?: string | null;
  secondary_cta_label?: string | null;
  audience?: LandingAudienceItem[];
  outcomes?: LandingOutcomeItem[];
  curriculum_fallback?: LandingCurriculumItem[];
  trust_items?: LandingTrustItem[];
  faqs?: LandingFaqItem[];
  seo_title?: string | null;
  seo_description?: string | null;
  og_image_url?: string | null;
  is_published?: boolean;
}

export async function getLandingPages(): Promise<AcademyLandingPage[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase
    .from("academy_landing_pages")
    .select(`
      *,
      course:courses (
        id,
        title,
        slug,
        cover_url
      )
    `)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching landing pages with course join:", error);

    // Fallback: try querying without relation join if PostgREST relation cache fails
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("academy_landing_pages")
      .select("*")
      .order("updated_at", { ascending: false });

    if (fallbackError) {
      console.error("Error fetching landing pages directly:", fallbackError);
      throw fallbackError;
    }

    return (fallbackData || []).map(normalizeLandingRecord);
  }

  return (data || []).map(normalizeLandingRecord);
}

export async function getLandingPageById(id: string): Promise<AcademyLandingPage | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase
    .from("academy_landing_pages")
    .select(`
      *,
      course:courses (
        id,
        title,
        slug,
        cover_url
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching landing page by id '${id}':`, error);
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("academy_landing_pages")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fallbackError || !fallbackData) return null;
    return normalizeLandingRecord(fallbackData);
  }

  if (!data) return null;
  return normalizeLandingRecord(data);
}

export async function getLandingPageBySlug(slug: string): Promise<AcademyLandingPage | null> {
  const supabase = getSupabaseBrowserClient();
  const normalizedSlug = slug.toLowerCase().trim();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("academy_landing_pages")
        .select(`
          *,
          course:courses (
            id,
            title,
            slug,
            cover_url
          )
        `)
        .eq("slug", normalizedSlug)
        .maybeSingle();

      if (!error && data) {
        return normalizeLandingRecord(data);
      }
    } catch (err) {
      console.warn(`[getLandingPageBySlug Exception for '${slug}']:`, err);
    }
  }

  // Fallback default landing configuration for BIOLOGICAL TRIGGER campaign
  if (normalizedSlug === "biological-trigger") {
    return {
      id: "default-biological-trigger-landing",
      title: "Chuyên đề: BIOLOGICAL TRIGGER",
      slug: "biological-trigger",
      course_id: null,
      hero_badge: "Buổi học thu phễu • Online Zoom",
      hero_title: "Chuyên đề: BIOLOGICAL TRIGGER",
      hero_subtitle: "Kích hoạt tín hiệu tái tạo sinh học với Holistic Crystaling Peel chuẩn Y Khoa Hàn Quốc.",
      hero_cover_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&auto=format&fit=crop",
      primary_cta_label: "Đăng ký giữ chỗ ngay",
      secondary_cta_label: "Xem lịch học chi tiết",
      audience: [
        {
          title: "Chủ Spa / Clinic",
          description: "Muốn hiểu đúng cơ chế vi kim sinh học Holistic Crystaling Peel để xây dựng liệu trình mũi nhọn tăng trưởng doanh thu."
        },
        {
          title: "Kỹ thuật viên Thẩm mỹ",
          description: "Cần nắm vững protocol thao tác chuẩn Y Khoa, kiểm soát lực massage vi tinh thể và kỹ thuật dập tắt kích ứng."
        },
        {
          title: "Đội ngũ Tư vấn viên",
          description: "Cần hiểu rõ bản chất liệu trình tái tạo để giải thích thuyết phục, tăng tỷ lệ chốt sales liệu trình."
        },
        {
          title: "Spa đang làm Vi Kim / Peel",
          description: "Dành cho các cơ sở đã làm peel nhưng kết quả chưa ổn định hoặc hay gặp sự cố tăng sắc tố/kích ứng."
        }
      ],
      outcomes: [
        {
          title: "Cơ chế Kích hoạt Sinh học",
          description: "Nắm vững cơ chế thâm nhập của vi tinh thể Crystaling Spicule giúp kích hoạt chu trình tái tạo tế bào mới."
        },
        {
          title: "Chỉ định & Chống chỉ định",
          description: "Phân loại chính xác tình trạng da phù hợp và rà soát kỹ các trường hợp tuyệt đối không được peel."
        },
        {
          title: "Phối hợp Protocol Chuẩn",
          description: "Biết cách kết hợp vi kim với ampoule tế bào gốc và huyết thanh phục hồi cao cấp DESEMBRE."
        },
        {
          title: "An toàn & Phục hồi Sau Peel",
          description: "Quy trình làm dịu da tức thì, bảo vệ hàng rào da và dặn dò khách hàng chăm sóc chuẩn tại nhà."
        },
        {
          title: "Tư vấn & Chốt Liệu Trình",
          description: "Sở hữu bộ kịch bản tư vấn thực chiến giúp giải thích cơ chế khoa học cho khách hàng tự tin."
        }
      ],
      curriculum_fallback: [],
      trust_items: [
        { title: "Chứng nhận Hoàn thành", description: "Cấp chứng nhận đào tạo từ DESEMBRE Training Center", badge: "Uy tín" },
        { title: "Tài liệu Thực chiến", description: "Trọn bộ Slide bài giảng & Video kỹ thuật thao tác", badge: "Đầy đủ" }
      ],
      faqs: [
        {
          q: "Khóa học được tổ chức dưới hình thức nào?",
          a: "Khóa học tổ chức trực tuyến qua Zoom Online, có giảng viên hướng dẫn tương tác trực tiếp và giải đáp thắc mắc lâm sàng."
        },
        {
          q: "Tôi có được nhận tài liệu hướng dẫn sau buổi học không?",
          a: "Có, học viên tham gia sẽ nhận trọn bộ tài liệu protocol và hướng dẫn chăm sóc sau liệu trình từ DESEMBRE Training Center."
        }
      ],
      seo_title: "Chuyên đề BIOLOGICAL TRIGGER | DESEMBRE Training Center",
      seo_description: "Đăng ký chuyên đề BIOLOGICAL TRIGGER - Kích hoạt tín hiệu tái tạo da với Holistic Crystaling Peel chuẩn Y Khoa.",
      og_image_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&auto=format&fit=crop",
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return null;
}

export async function createLandingPage(payload: CreateLandingPagePayload): Promise<AcademyLandingPage> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const normalizedSlug = payload.slug.toLowerCase().trim().replace(/\s+/g, "-");

  const { data, error } = await supabase
    .from("academy_landing_pages")
    .insert({
      title: payload.title,
      slug: normalizedSlug,
      course_id: payload.course_id || null,
      hero_badge: payload.hero_badge || null,
      hero_title: payload.hero_title || payload.title,
      hero_subtitle: payload.hero_subtitle || null,
      hero_cover_url: payload.hero_cover_url || null,
      primary_cta_label: payload.primary_cta_label || 'Đăng ký lớp gần nhất',
      secondary_cta_label: payload.secondary_cta_label || 'Nhận tư vấn lộ trình',
      audience: payload.audience || [],
      outcomes: payload.outcomes || [],
      curriculum_fallback: payload.curriculum_fallback || [],
      trust_items: payload.trust_items || [],
      faqs: payload.faqs || [],
      seo_title: payload.seo_title || payload.title,
      seo_description: payload.seo_description || null,
      og_image_url: payload.og_image_url || null,
      is_published: !!payload.is_published,
    })
    .select(`
      *,
      course:courses (
        id,
        title,
        slug,
        cover_url
      )
    `)
    .single();

  if (error) throw error;
  return normalizeLandingRecord(data);
}

export async function updateLandingPage(id: string, payload: Partial<CreateLandingPagePayload>): Promise<AcademyLandingPage> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const updateBody: any = {
    updated_at: new Date().toISOString(),
  };

  if (payload.title !== undefined) updateBody.title = payload.title;
  if (payload.slug !== undefined) updateBody.slug = payload.slug.toLowerCase().trim().replace(/\s+/g, "-");
  if (payload.course_id !== undefined) updateBody.course_id = payload.course_id || null;
  if (payload.hero_badge !== undefined) updateBody.hero_badge = payload.hero_badge || null;
  if (payload.hero_title !== undefined) updateBody.hero_title = payload.hero_title || null;
  if (payload.hero_subtitle !== undefined) updateBody.hero_subtitle = payload.hero_subtitle || null;
  if (payload.hero_cover_url !== undefined) updateBody.hero_cover_url = payload.hero_cover_url || null;
  if (payload.primary_cta_label !== undefined) updateBody.primary_cta_label = payload.primary_cta_label || 'Đăng ký lớp gần nhất';
  if (payload.secondary_cta_label !== undefined) updateBody.secondary_cta_label = payload.secondary_cta_label || 'Nhận tư vấn lộ trình';
  if (payload.audience !== undefined) updateBody.audience = payload.audience;
  if (payload.outcomes !== undefined) updateBody.outcomes = payload.outcomes;
  if (payload.curriculum_fallback !== undefined) updateBody.curriculum_fallback = payload.curriculum_fallback;
  if (payload.trust_items !== undefined) updateBody.trust_items = payload.trust_items;
  if (payload.faqs !== undefined) updateBody.faqs = payload.faqs;
  if (payload.seo_title !== undefined) updateBody.seo_title = payload.seo_title || null;
  if (payload.seo_description !== undefined) updateBody.seo_description = payload.seo_description || null;
  if (payload.og_image_url !== undefined) updateBody.og_image_url = payload.og_image_url || null;
  if (payload.is_published !== undefined) updateBody.is_published = !!payload.is_published;

  const { data, error } = await supabase
    .from("academy_landing_pages")
    .update(updateBody)
    .eq("id", id)
    .select(`
      *,
      course:courses (
        id,
        title,
        slug,
        cover_url
      )
    `)
    .single();

  if (error) throw error;
  return normalizeLandingRecord(data);
}

export async function deleteLandingPage(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { error } = await supabase
    .from("academy_landing_pages")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

function normalizeLandingRecord(data: any): AcademyLandingPage {
  return {
    ...data,
    audience: Array.isArray(data.audience) ? data.audience : [],
    outcomes: Array.isArray(data.outcomes) ? data.outcomes : [],
    curriculum_fallback: Array.isArray(data.curriculum_fallback) ? data.curriculum_fallback : [],
    trust_items: Array.isArray(data.trust_items) ? data.trust_items : [],
    faqs: Array.isArray(data.faqs) ? data.faqs : [],
  };
}
