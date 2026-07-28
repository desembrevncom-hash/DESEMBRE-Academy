import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PublicInstructorInfo, PublicSessionInfo, PublicCourseBatch } from "./publicTrainingApi";

export interface PublicCourseDetail {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
  batches: PublicCourseBatch[];
}

export interface PublicInstructorProfile {
  id: string;
  full_name: string;
  slug: string;
  title: string | null;
  avatar_url: string | null;
  expertise: string[];
  bio: string | null;
  highlights: string[];
  social_links: {
    website?: string;
    facebook?: string;
    linkedin?: string;
  };
  is_active: boolean;
  batches: PublicCourseBatch[];
}

export async function getPublicCourseBySlug(slug: string): Promise<PublicCourseDetail | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc("public_get_course_detail", {
      p_slug: slug,
    });

    if (error) {
      console.error("[getPublicCourseBySlug RPC Error]", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    return data as PublicCourseDetail | null;
  } catch (err) {
    console.error("[getPublicCourseBySlug Exception]", err);
    return null;
  }
}

export async function getPublicInstructorBySlug(slug: string): Promise<PublicInstructorProfile | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc("public_get_instructor_profile", {
      p_slug: slug,
    });

    if (error) {
      console.error("[getPublicInstructorBySlug RPC Error]", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    return data as PublicInstructorProfile | null;
  } catch (err) {
    console.error("[getPublicInstructorBySlug Exception]", err);
    return null;
  }
}

export async function getUpcomingBatchesForCourse(courseId: string): Promise<PublicCourseBatch[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("course_batches")
      .select("*, course:courses(*), sessions:course_sessions(*), instructor:academy_instructors(*)")
      .eq("course_id", courseId)
      .order("start_date", { ascending: true });

    if (error) {
      console.error("[getUpcomingBatchesForCourse Error]", error);
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
}

export async function getCoursesByInstructor(instructorId: string): Promise<PublicCourseBatch[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("course_batches")
      .select("*, course:courses(*), sessions:course_sessions(*)")
      .eq("instructor_id", instructorId)
      .order("start_date", { ascending: true });

    if (error) {
      console.error("[getCoursesByInstructor Error]", error);
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
}
