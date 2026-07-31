import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createCourseResponseSchema,
  createModuleResponseSchema,
  createLessonResponseSchema,
  basicSuccessResponseSchema,
  courseStatusMutationResponseSchema,
} from "../validators";
import type {
  AcademyAdminCategory,
  AcademyAdminCategoryManagerItem,
  CreateAcademyCategoryInput,
  UpdateAcademyCategoryInput,
  AcademyAdminCourseListItem,
  AcademyAdminCourseEditor,
  CreateAcademyCourseInput,
  UpdateAcademyCourseInput,
  CreateAcademyModuleInput,
  UpdateAcademyModuleInput,
  ReorderAcademyModulesInput,
  CreateAcademyLessonInput,
  UpdateAcademyLessonInput,
  ReorderAcademyLessonsInput,
  AcademyCourseStatus,
} from "../types";

export interface SetAcademyArticleContentInput {
  p_lesson_id: string;
  p_markdown: string;
}

export interface SetAcademyExternalLinkContentInput {
  p_lesson_id: string;
  p_url: string;
}

export class AdminCourseApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AdminCourseApiError";
  }
}

function handleRpcError(error: unknown): never {
  const err = error as Record<string, unknown>;
  if (err?.code) {
    // Safely normalize publish validation failure without parsing raw PostgreSQL details
    if (typeof err.message === "string" && err.message.startsWith("PUBLISH_VALIDATION_FAILED")) {
      throw new AdminCourseApiError("PUBLISH_VALIDATION_FAILED", "Course is not ready to publish.");
    }

    // Normalizing specific known errors from the DB
    switch (err.message) {
      case "INVALID_TITLE":
        throw new AdminCourseApiError("INVALID_TITLE", "The title provided is invalid.");
      case "DUPLICATE_SLUG":
        throw new AdminCourseApiError("DUPLICATE_SLUG", "This URL slug is already in use.");
      case "COURSE_NOT_FOUND":
        throw new AdminCourseApiError("COURSE_NOT_FOUND", "Course not found.");
      case "UNAUTHORIZED":
        throw new AdminCourseApiError("UNAUTHORIZED", "Authentication required.");
      case "FORBIDDEN":
        throw new AdminCourseApiError(
          "FORBIDDEN",
          "You do not have permission to perform this action.",
        );
      default:
        throw new AdminCourseApiError(
          String(err.code),
          typeof err.message === "string" ? err.message : "An unexpected database error occurred.",
        );
    }
  }
  throw new AdminCourseApiError("NETWORK_ERROR", "A network or unexpected error occurred.");
}

function getClientOrThrow() {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error("Supabase client is not available in this environment.");
  }
  return client;
}

export const academyAdminCoursesApi = {
  async listCourses(params?: {
    status?: AcademyCourseStatus;
    search?: string;
  }): Promise<AcademyAdminCourseListItem[]> {
    const client = getClientOrThrow();
    
    // 1. Fetch courses via RPC
    const { data: rpcData, error: rpcError } = await client.rpc("admin_list_academy_courses", {
      p_status: params?.status || null,
      p_search: params?.search || null,
    });

    let courses: any[] = [];
    if (!rpcError && Array.isArray(rpcData)) {
      courses = rpcData;
    } else {
      let query = client.from("courses").select("id, title, slug, status, catalog_visibility, category_id, updated_at, created_at");
      if (params?.status) query = query.eq("status", params.status);
      if (params?.search) query = query.ilike("title", `%${params.search}%`);
      const { data: directData, error: directErr } = await query.order("updated_at", { ascending: false });
      if (directErr) handleRpcError(directErr);
      courses = directData || [];
    }

    // 2. Explicitly query public.courses to guarantee category_id, category_name & category_slug
    const courseIds = courses.map((c) => c.id).filter(Boolean);
    if (courseIds.length > 0) {
      try {
        const { data: dbCourses } = await client
          .from("courses")
          .select("id, category_id, category:course_categories(id, name, slug)")
          .in("id", courseIds);

        if (dbCourses && dbCourses.length > 0) {
          const catMap = new Map(dbCourses.map((dc: any) => [dc.id, dc]));
          courses = courses.map((c) => {
            const dbC = catMap.get(c.id);
            const cat = dbC?.category;
            return {
              ...c,
              category_id: dbC?.category_id ?? c.category_id ?? null,
              category_name: cat?.name ?? c.category_name ?? null,
              category_slug: cat?.slug ?? c.category_slug ?? null,
            };
          });
        }
      } catch (err) {
        console.warn("[listCourses category enrichment warning]", err);
      }
    }

    return courses as AcademyAdminCourseListItem[];
  },

  async listCategories(): Promise<AcademyAdminCategory[]> {
    const client = getClientOrThrow();
    const { data, error } = await client.rpc("admin_list_academy_categories");

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as AcademyAdminCategory[];
    }

    // Direct table fetch from public.course_categories to guarantee real DB records
    const { data: dbCategories } = await client
      .from("course_categories")
      .select("id, name, slug")
      .order("name");

    if (dbCategories && dbCategories.length > 0) {
      return dbCategories as AcademyAdminCategory[];
    }

    const { data: fallbackCategories } = await client
      .from("categories")
      .select("id, name, slug")
      .order("name");

    return (fallbackCategories as AcademyAdminCategory[]) || [];
  },

  async listCategoryManager(): Promise<AcademyAdminCategoryManagerItem[]> {
    const client = getClientOrThrow();
    const { data, error } = await client.rpc("admin_list_academy_category_manager");

    if (error) {
      handleRpcError(error);
    }

    return (data as AcademyAdminCategoryManagerItem[]) || [];
  },

  async createCategory(input: CreateAcademyCategoryInput): Promise<{ id: string }> {
    const client = getClientOrThrow();
    const { data, error } = await client.rpc("admin_create_academy_category", {
      p_name: input.p_name,
      p_slug: input.p_slug,
      p_description: input.p_description || null,
      p_status: input.p_status,
    });

    if (error) {
      handleRpcError(error);
    }

    // Returning ID based on the RPC response which is a table with id column
    const rows = data as { id: string }[];
    return { id: rows[0]?.id };
  },

  async updateCategory(input: UpdateAcademyCategoryInput): Promise<{ success: boolean }> {
    const client = getClientOrThrow();
    const { error } = await client.rpc("admin_update_academy_category", {
      p_category_id: input.p_category_id,
      p_name: input.p_name,
      p_slug: input.p_slug,
      p_description: input.p_description || null,
      p_status: input.p_status,
    });

    if (error) {
      handleRpcError(error);
    }

    return { success: true };
  },

  async getCourseEditor(courseId: string): Promise<AcademyAdminCourseEditor> {
    const client = getClientOrThrow();
    const { data, error } = await client.rpc("admin_get_academy_course_editor", {
      p_course_id: courseId,
    });

    if (error) {
      handleRpcError(error);
    }

    if (!data) {
      throw new AdminCourseApiError("EMPTY_RESPONSE", "The server returned an empty response.");
    }

    return data as unknown as AcademyAdminCourseEditor;
  },

  async createCourse(input: CreateAcademyCourseInput): Promise<{ id: string }> {
    const payload = {
      p_title: input.p_title,
      p_slug: input.p_slug,
      p_description: input.p_description || null,
      p_category_id: input.p_category_id || null,
      p_catalog_visibility: input.p_catalog_visibility || "private",
      p_enrollment_policy: input.p_enrollment_policy || "closed",
      p_access_policy: input.p_access_policy || "dynamic",
      p_pricing_model: input.p_pricing_model || "included",
    };

    console.log("[Create Course Payload]", payload);

    const client = getClientOrThrow();
    const { data, error } = await client.rpc("admin_create_academy_course", payload);

    if (error) {
      handleRpcError(error);
    }

    try {
      // Validate the response boundary
      return createCourseResponseSchema.parse(data);
    } catch (validationError) {
      throw new AdminCourseApiError(
        "INVALID_RESPONSE",
        "The server returned an unexpected response format.",
      );
    }
  },

  async updateCourse(input: UpdateAcademyCourseInput): Promise<{ success: boolean }> {
    const payload = {
      p_course_id: input.p_course_id,
      p_title: input.p_title,
      p_slug: input.p_slug,
      p_description: input.p_description || null,
      p_category_id: input.p_category_id || null,
      p_catalog_visibility: input.p_catalog_visibility || "private",
      p_enrollment_policy: input.p_enrollment_policy || "closed",
      p_access_policy: input.p_access_policy || "dynamic",
      p_pricing_model: input.p_pricing_model || "included",
    };

    console.log("[Update Course Payload]", payload);

    const client = getClientOrThrow();
    const { data, error } = await client.rpc("admin_update_academy_course", payload);

    if (error) {
      handleRpcError(error);
    }

    if (input.cover_url !== undefined || input.summary !== undefined) {
      await client
        .from("courses")
        .update({
          cover_url: input.cover_url || null,
          summary: input.summary || null,
        })
        .eq("id", input.p_course_id);
    }

    return { success: true };
  },

  async updateCoursePublicDetails(
    courseId: string,
    payload: { cover_url?: string | null; summary?: string | null }
  ): Promise<{ success: boolean }> {
    const client = getClientOrThrow();
    const { error } = await client
      .from("courses")
      .update({
        cover_url: payload.cover_url || null,
        summary: payload.summary || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId);

    if (error) {
      console.error("[updateCoursePublicDetails Error]", error);
      throw error;
    }
    return { success: true };
  },

  async createModule(input: CreateAcademyModuleInput): Promise<{ id: string; position: number }> {
    const client = getClientOrThrow();
    const { data, error } = await client.rpc("admin_create_academy_module", {
      p_course_id: input.p_course_id,
      p_title: input.p_title,
    });

    if (error) handleRpcError(error);

    try {
      return createModuleResponseSchema.parse(data);
    } catch (e) {
      throw new AdminCourseApiError("INVALID_RESPONSE", "Invalid module creation response format.");
    }
  },

  async updateModule(input: UpdateAcademyModuleInput): Promise<{ success: boolean }> {
    const client = getClientOrThrow();
    const { error } = await client.rpc("admin_update_academy_module", {
      p_module_id: input.p_module_id,
      p_title: input.p_title,
    });

    if (error) handleRpcError(error);
    return { success: true };
  },

  async reorderModules(input: ReorderAcademyModulesInput): Promise<{ success: boolean }> {
    const client = getClientOrThrow();
    const { error } = await client.rpc("admin_reorder_academy_modules", {
      p_course_id: input.p_course_id,
      p_module_ids: input.p_module_ids,
    });

    if (error) handleRpcError(error);
    return { success: true };
  },

  async createLesson(input: CreateAcademyLessonInput): Promise<{ id: string; position: number }> {
    const client = getClientOrThrow();
    const { data, error } = await client.rpc("admin_create_academy_lesson", {
      p_module_id: input.p_module_id,
      p_title: input.p_title,
      p_type: input.p_type,
      p_description: input.p_description || null,
      p_is_preview: input.p_is_preview ?? false,
    });

    if (error) handleRpcError(error);

    try {
      return createLessonResponseSchema.parse(data);
    } catch (e) {
      throw new AdminCourseApiError("INVALID_RESPONSE", "Invalid lesson creation response format.");
    }
  },

  async updateLesson(input: UpdateAcademyLessonInput): Promise<{ success: boolean }> {
    const client = getClientOrThrow();
    const { error } = await client.rpc("admin_update_academy_lesson", {
      p_lesson_id: input.p_lesson_id,
      p_title: input.p_title,
      p_description: input.p_description || null,
      p_is_preview: input.p_is_preview,
    });

    if (error) handleRpcError(error);
    return { success: true };
  },

  async reorderLessons(input: ReorderAcademyLessonsInput): Promise<{ success: boolean }> {
    const client = getClientOrThrow();
    const { error } = await client.rpc("admin_reorder_academy_lessons", {
      p_module_id: input.p_module_id,
      p_lesson_ids: input.p_lesson_ids,
    });

    if (error) handleRpcError(error);
    return { success: true };
  },

  async setArticleContent(input: SetAcademyArticleContentInput): Promise<{ success: boolean }> {
    const client = getClientOrThrow();
    const { data, error } = await client.rpc("admin_set_academy_article_content", {
      p_lesson_id: input.p_lesson_id,
      p_markdown: input.p_markdown,
    });

    if (error) handleRpcError(error);

    try {
      return basicSuccessResponseSchema.parse(data);
    } catch {
      throw new AdminCourseApiError("INVALID_RESPONSE", "Invalid article save response");
    }
  },

  async setExternalLinkContent(
    input: SetAcademyExternalLinkContentInput,
  ): Promise<{ success: boolean }> {
    const client = getClientOrThrow();
    const { data, error } = await client.rpc("admin_set_academy_external_link_content", {
      p_lesson_id: input.p_lesson_id,
      p_url: input.p_url,
    });

    if (error) handleRpcError(error);

    try {
      return basicSuccessResponseSchema.parse(data);
    } catch {
      throw new AdminCourseApiError("INVALID_RESPONSE", "Invalid external link save response");
    }
  },

  async publishCourse(courseId: string): Promise<{ success: boolean }> {
    const client = getClientOrThrow();
    const { data, error } = await client.rpc("admin_publish_academy_course", {
      p_course_id: courseId,
    });

    if (error) handleRpcError(error);

    try {
      return courseStatusMutationResponseSchema.parse(data);
    } catch {
      throw new AdminCourseApiError("INVALID_RESPONSE", "Invalid publish response format.");
    }
  },

  async unpublishCourse(courseId: string): Promise<{ success: boolean }> {
    const client = getClientOrThrow();
    const { data, error } = await client.rpc("admin_unpublish_academy_course", {
      p_course_id: courseId,
    });

    if (error) handleRpcError(error);

    try {
      return courseStatusMutationResponseSchema.parse(data);
    } catch {
      throw new AdminCourseApiError("INVALID_RESPONSE", "Invalid unpublish response format.");
    }
  },

  async archiveCourse(courseId: string): Promise<{ success: boolean }> {
    const client = getClientOrThrow();
    const { data, error } = await client.rpc("admin_archive_academy_course", {
      p_course_id: courseId,
    });

    if (error) handleRpcError(error);

    try {
      return courseStatusMutationResponseSchema.parse(data);
    } catch {
      throw new AdminCourseApiError("INVALID_RESPONSE", "Invalid archive response format.");
    }
  },
};

export const getCourseMarketingMetadata = async (courseId: string) => {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client not initialized");
  
  const { data, error } = await supabase.rpc("admin_get_course_marketing_metadata", {
    p_course_id: courseId,
  });

  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

export const upsertCourseMarketingMetadata = async (input: {
  p_course_id: string;
  p_level: 'basic' | 'intermediate' | 'advanced' | null;
  p_short_description: string | null;
  p_estimated_minutes: number | null;
  p_is_featured: boolean;
  p_featured_order: number;
  p_audience: string[];
  p_outcomes: string[];
  p_thumbnail_url?: string | null;
  p_thumbnail_alt?: string | null;
  p_seo_title?: string | null;
  p_seo_description?: string | null;
}) => {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client not initialized");
  
  const { error } = await supabase.rpc("admin_upsert_course_marketing_metadata", input);

  if (error) {
    throw new Error(error.message);
  }
};

export const uploadCourseThumbnail = async (courseId: string, file: File): Promise<string> => {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client not initialized");

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '').substring(0, 50);
  const path = `course-thumbnails/${courseId}/${Date.now()}-${safeName}`;

  // 1. Upload to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("academy-public-assets")
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Lỗi upload ảnh: ${uploadError.message}`);
  }

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from("academy-public-assets")
    .getPublicUrl(uploadData.path);

  // 3. Log to media_assets table
  const { error: dbError } = await supabase.from('academy_media_assets').insert({
    course_id: courseId,
    file_name: file.name,
    file_size: file.size,
    content_type: file.type,
    storage_path: uploadData.path,
    public_url: publicUrl
  });

  if (dbError) {
    console.error("Failed to log media asset:", dbError);
  }

  return publicUrl;
};
