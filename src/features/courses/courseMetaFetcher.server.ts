import { createServerFn } from "@tanstack/react-start";
import type { CourseMetaForSeo } from "./utils/seo";

/**
 * Server function: gọi Supabase REST API để lấy course meta cho SSR head tags.
 * - Chỉ dùng public RPC với anon/publishable key — không gọi service_role.
 * - Chạy server-side để social crawlers đọc meta tags ngay trong HTML ban đầu.
 * - Trả null khi lỗi / không tìm thấy — không crash page.
 *
 * File đặt tại courses/courseMetaFetcher.server.ts để TanStack Start import-protection
 * plugin nhận ra suffix .server.ts và cho phép import từ route loader.
 */
export const fetchCourseMetaForSeo = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<CourseMetaForSeo> => {
    try {
      // Đọc env bên trong handler để đảm bảo server-side context
      const supabaseUrl =
        process.env.SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL ||
        "";
      const supabaseKey =
        process.env.SUPABASE_PUBLISHABLE_KEY ||
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        "";

      if (!supabaseUrl || !supabaseKey) {
        console.warn("[fetchCourseMetaForSeo] Missing Supabase env vars — skipping SSR meta fetch.");
        return null;
      }

      // Gọi public RPC qua Supabase REST (không cần browser client)
      const rpcUrl = `${supabaseUrl}/rest/v1/rpc/get_academy_public_course_outline`;
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ p_course_slug: slug }),
      });

      if (!res.ok) {
        // 404 / error → course không tồn tại hoặc không published
        return null;
      }

      const raw = await res.json() as Record<string, unknown> | null;
      if (!raw || typeof raw !== "object") return null;

      // Kiểm tra state: chỉ serve SEO khi course AVAILABLE
      const state = (raw as any).state as string | undefined;
      if (state && state !== "AVAILABLE") return null;

      const course = (raw as any).course as Record<string, unknown> | undefined;
      if (!course) return null;

      const marketing = (course.marketing ?? null) as Record<string, unknown> | null;

      // Validate thumbnail_url: chỉ chấp nhận absolute https:// URL
      const rawThumbUrl = marketing?.thumbnail_url;
      const safeThumbUrl =
        typeof rawThumbUrl === "string" && rawThumbUrl.startsWith("https://")
          ? rawThumbUrl
          : null;

      // Chỉ trả về minimal fields — không leak modules/lessons/progress/access
      return {
        title: typeof course.title === "string" ? course.title : "",
        slug: typeof course.slug === "string" ? course.slug : slug,
        description:
          typeof course.description === "string" ? course.description : null,
        marketing: marketing
          ? {
              seo_title:
                typeof marketing.seo_title === "string"
                  ? marketing.seo_title || null
                  : null,
              seo_description:
                typeof marketing.seo_description === "string"
                  ? marketing.seo_description || null
                  : null,
              short_description:
                typeof marketing.short_description === "string"
                  ? marketing.short_description || null
                  : null,
              thumbnail_url: safeThumbUrl,
              thumbnail_alt:
                typeof marketing.thumbnail_alt === "string"
                  ? marketing.thumbnail_alt || null
                  : null,
            }
          : null,
      };
    } catch (err) {
      // SSR meta fetch thất bại — log và trả null (không crash page)
      console.warn("[fetchCourseMetaForSeo] Error fetching course meta:", err);
      return null;
    }
  });
