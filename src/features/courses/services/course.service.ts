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
      return validateEnrollmentResult(data);
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
