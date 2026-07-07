import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { academyLessonContentResponseSchema, edgeFunctionMediaResponseSchema } from "../validators";
import {
  AcademyLessonContentResponse,
  EdgeFunctionMediaResponse,
  LessonProgressPayload,
  LessonProgressStatus,
} from "../types";
import { normalizeLessonPositionSeconds } from "../progress-utils";

export class LessonContentError extends Error {
  constructor(
    public message: string,
    public code?: string,
    public status?: number,
  ) {
    super(message);
    this.name = "LessonContentError";
  }
}

function normalizeError(error: unknown, fallbackMessage: string): LessonContentError {
  const err = error as Record<string, unknown>;
  return new LessonContentError(
    typeof err?.message === "string" ? err.message : fallbackMessage,
    typeof err?.code === "string" ? err.code : undefined,
    typeof err?.status === "number" ? err.status : undefined,
  );
}

export function isRetryableNetworkError(err: unknown): boolean {
  const str = String(err).toLowerCase();
  const msg = (err as any)?.message?.toLowerCase() || "";
  return (
    str.includes("networkerror") ||
    str.includes("failed to fetch") ||
    str.includes("request canceled") ||
    msg.includes("networkerror") ||
    msg.includes("failed to fetch")
  );
}

function getClientOrThrow() {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error("Supabase client is not available in this environment.");
  }
  return client;
}

export const lessonContentService = {
  async getLessonContent(
    courseSlug: string,
    lessonId: string,
  ): Promise<AcademyLessonContentResponse> {
    const client = getClientOrThrow();
    const { data, error } = await client.rpc("get_academy_lesson_content", {
      p_course_slug: courseSlug,
      p_lesson_id: lessonId,
    });

    if (error) {
      throw normalizeError(error, "Failed to load lesson content");
    }

    const validationResult = academyLessonContentResponseSchema.safeParse(data);
    if (!validationResult.success) {
      console.error("Payload validation failed", validationResult.error);
      throw new LessonContentError("INVALID_DATA");
    }

    return validationResult.data as AcademyLessonContentResponse;
  },

  async getSignedLessonMedia(
    courseSlug: string,
    lessonId: string,
  ): Promise<EdgeFunctionMediaResponse> {
    const client = getClientOrThrow();
    const { data, error } = await client.functions.invoke("academy-lesson-media", {
      body: {
        courseSlug,
        lessonId,
      },
    });

    if (error) {
      throw normalizeError(error, "Failed to obtain signed media");
    }

    const validationResult = edgeFunctionMediaResponseSchema.safeParse(data);
    if (!validationResult.success) {
      console.error("Edge Function validation failed", validationResult.error);
      throw new LessonContentError("INVALID_DATA");
    }

    return validationResult.data as EdgeFunctionMediaResponse;
  },

  async saveLessonProgress(
    lessonId: string,
    status: LessonProgressStatus,
    progressPercent: number,
    lastPositionSeconds: number,
  ): Promise<LessonProgressPayload> {
    const client = getClientOrThrow();

    const normalizedPos = normalizeLessonPositionSeconds(lastPositionSeconds);

    const payload = {
      p_lesson_id: lessonId,
      p_status: status,
      p_progress_percent: progressPercent,
      p_last_position_seconds: normalizedPos,
    };

    if (!Number.isInteger(payload.p_last_position_seconds)) {
      payload.p_last_position_seconds = 0;
    }

    const { data, error } = await client.rpc("save_current_lesson_progress", payload);

    if (error) {
      throw normalizeError(error, "Có lỗi xảy ra khi lưu tiến trình học.");
    }

    // Validate the exact response
    const row = data as any;
    if (status === "completed") {
      if (
        !row ||
        row.status !== "completed" ||
        row.progress_percent !== 100 ||
        !Number.isInteger(row.last_position_seconds) ||
        row.lesson_id !== lessonId
      ) {
        throw new LessonContentError("INVALID_DATA");
      }
    }

    return {
      status: row?.status || status,
      progress_percent: row?.progress_percent ?? progressPercent,
      last_position_seconds: row?.last_position_seconds ?? payload.p_last_position_seconds,
    };
  },
};
