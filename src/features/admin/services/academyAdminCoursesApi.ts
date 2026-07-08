import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createCourseResponseSchema,
  createModuleResponseSchema,
  createLessonResponseSchema,
} from "../validators";
import type {
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
    const { data, error } = await client.rpc("admin_list_academy_courses", {
      p_status: params?.status || null,
      p_search: params?.search || null,
    });

    if (error) {
      handleRpcError(error);
    }

    return (data as AcademyAdminCourseListItem[]) || [];
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
    const client = getClientOrThrow();
    const { data, error } = await client.rpc("admin_create_academy_course", {
      p_title: input.p_title,
      p_slug: input.p_slug,
      p_description: input.p_description || null,
      p_category_id: input.p_category_id || null,
      p_catalog_visibility: input.p_catalog_visibility || "private",
      p_enrollment_policy: input.p_enrollment_policy || "closed",
      p_access_policy: input.p_access_policy || "dynamic",
      p_pricing_model: input.p_pricing_model || "included",
    });

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
    const client = getClientOrThrow();
    const { data, error } = await client.rpc("admin_update_academy_course", {
      p_course_id: input.p_course_id,
      p_title: input.p_title,
      p_slug: input.p_slug,
      p_description: input.p_description || null,
      p_category_id: input.p_category_id || null,
      p_catalog_visibility: input.p_catalog_visibility,
      p_enrollment_policy: input.p_enrollment_policy,
      p_access_policy: input.p_access_policy,
      p_pricing_model: input.p_pricing_model,
    });

    if (error) {
      handleRpcError(error);
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
    const { error } = await client.rpc("admin_set_academy_article_content", {
      p_lesson_id: input.p_lesson_id,
      p_markdown: input.p_markdown,
    });

    if (error) handleRpcError(error);
    return { success: true };
  },

  async setExternalLinkContent(
    input: SetAcademyExternalLinkContentInput,
  ): Promise<{ success: boolean }> {
    const client = getClientOrThrow();
    const { error } = await client.rpc("admin_set_academy_external_link_content", {
      p_lesson_id: input.p_lesson_id,
      p_url: input.p_url,
    });

    if (error) handleRpcError(error);
    return { success: true };
  },
};
