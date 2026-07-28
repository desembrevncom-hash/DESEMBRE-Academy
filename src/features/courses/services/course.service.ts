import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  validateCatalog,
  validateCurrentCourses,
  validateCourseOutline,
  validateEnrollmentResult,
  validateSaveProgressResult,
} from "../validators";
import type { CourseRuntimeErrorKind } from "../types";

function mapError(err: unknown): CourseRuntimeErrorKind {
  if (!err) return "UNKNOWN";
  const str = String(err).toLowerCase();
  const code = (err as Record<string, unknown>).code;
  if (str.includes("not authenticated") || str.includes("jwt") || code === "PGRST301")
    return "UNAUTHENTICATED";
  if (str.includes("network") || str.includes("fetch")) return "NETWORK";
  if (str.includes("permission denied") || code === "42501") return "PERMISSION_DENIED";
  if (str.includes("cannot enroll")) return "ENROLLMENT_REJECTED";
  if (
    str.includes("invalid progress") ||
    str.includes("cannot access course content") ||
    str.includes("active enrollment required")
  )
    return "PROGRESS_REJECTED";
  return "UNKNOWN";
}

export async function getCatalog() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  try {
    const { data, error } = await supabase.rpc("get_academy_course_catalog");
    if (error) throw error;
    try {
      return validateCatalog(data);
    } catch (e) {
      throw new Error("INVALID_DATA");
    }
  } catch (err: unknown) {
    if ((err as Error).message === "INVALID_DATA") throw "INVALID_DATA";
    throw mapError(err);
  }
}

export async function getPublicCatalog() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.rpc("get_academy_public_course_catalog");
    if (error) throw error;
    try {
      const mappedData = (data as any[]).map((c: any) => ({
        ...c,
        access_decision: {
          can_view: true,
          can_enroll: false,
          can_learn: false,
          reason: "NO_STUDENT_ACCOUNT",
          required_tier: null
        },
        current_enrollment_summary: null,
        current_progress_summary: null
      }));
      return validateCatalog(mappedData);
    } catch (e) {
      throw new Error("INVALID_DATA");
    }
  } catch (err: unknown) {
    if ((err as Error).message === "INVALID_DATA") throw "INVALID_DATA";
    throw mapError(err);
  }
}

export async function getPublicCourseOutline(slug: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  try {
    const { data, error } = await supabase.rpc("get_academy_public_course_outline", {
      p_course_slug: slug,
    });
    if (error) throw error;
    if (!data) throw new Error("COURSE_NOT_FOUND");
    try {
      // get_academy_public_course_outline is expected to return { course, modules }
      // We map it to include access_decision as NO_STUDENT_ACCOUNT
      const mappedData = {
        ...(data as any),
        access_decision: {
          can_view: true,
          can_enroll: false,
          can_learn: false,
          reason: "NO_STUDENT_ACCOUNT",
          required_tier: null
        }
      };
      return validateCourseOutline(mappedData);
    } catch (e) {
      throw new Error("INVALID_DATA");
    }
  } catch (err: unknown) {
    if ((err as Error).message === "INVALID_DATA") throw "INVALID_DATA";
    if ((err as Error).message === "COURSE_NOT_FOUND") throw "COURSE_NOT_FOUND";
    throw mapError(err);
  }
}

export async function getCurrentStudentCourses() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  try {
    const { data, error } = await supabase.rpc("get_current_student_courses");
    if (error) throw error;
    try {
      return validateCurrentCourses(data);
    } catch (e) {
      throw new Error("INVALID_DATA");
    }
  } catch (err: unknown) {
    if ((err as Error).message === "INVALID_DATA") throw "INVALID_DATA";
    throw mapError(err);
  }
}

export async function getCourseOutline(slug: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  try {
    const { data, error } = await supabase.rpc("get_academy_course_outline", {
      p_course_slug: slug,
    });
    if (error) throw error;
    if (!data) throw new Error("COURSE_NOT_FOUND");
    try {
      return validateCourseOutline(data);
    } catch (e) {
      throw new Error("INVALID_DATA");
    }
  } catch (err: unknown) {
    if ((err as Error).message === "INVALID_DATA") throw "INVALID_DATA";
    if ((err as Error).message === "COURSE_NOT_FOUND") throw "COURSE_NOT_FOUND";
    throw mapError(err);
  }
}

export async function enrollInCourse(slug: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  try {
    const { data, error } = await supabase.rpc("enroll_current_student_in_course", {
      p_course_slug: slug,
    });
    if (error) throw error;
    try {
      const result = validateEnrollmentResult(data);
      console.log(`[Enrollment] Success: auth_user=${supabase.auth.getUser()?.then(r => r.data.user?.id?.substring(0, 8))} | course=${slug} | enroll_id=${result.enrollment_id?.substring(0, 8)}`);
      return result;
    } catch (e) {
      throw new Error("INVALID_DATA");
    }
  } catch (err: unknown) {
    if ((err as Error).message === "INVALID_DATA") throw "INVALID_DATA";
    throw mapError(err);
  }
}

export async function saveLessonProgress(
  lessonId: string,
  status: string,
  progressPercent: number,
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  try {
    const { data, error } = await supabase.rpc("save_current_lesson_progress", {
      p_lesson_id: lessonId,
      p_status: status,
      p_progress_percent: progressPercent,
    });
    if (error) throw error;
    try {
      return validateSaveProgressResult(data);
    } catch (e) {
      throw new Error("INVALID_DATA");
    }
  } catch (err: unknown) {
    if ((err as Error).message === "INVALID_DATA") throw "INVALID_DATA";
    throw mapError(err);
  }
}

export async function getPublicCourseBatches() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.rpc("get_public_course_batches");
    if (error) throw error;
    return data as any[];
  } catch (err) {
    throw mapError(err);
  }
}

export async function getPublicCourseBatchDetail(slug: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc("get_public_course_batch_detail", {
      p_slug: slug,
    });
    if (error) throw error;
    return data as any;
  } catch (err) {
    throw mapError(err);
  }
}

export async function submitCourseRegistration(batchSlug: string, payload: any) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  try {
    const { data, error } = await supabase.rpc("submit_course_registration", {
      p_batch_slug: batchSlug,
      p_full_name: payload.full_name,
      p_phone: payload.phone,
      p_email: payload.email || null,
      p_company: payload.company || null,
      p_participant_role: payload.participant_role || null,
      p_notes: payload.notes || null,
      p_marketing_source: payload.marketing_source || null
    });
    if (error) throw error;
    return data as any;
  } catch (err) {
    throw err;
  }
}

