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

    if (!error && data) {
      return data as PublicCourseDetail;
    }

    console.warn("[getPublicCourseBySlug RPC error/empty, attempting fallback query]:", slug, error);

    // Fallback: Direct table query if RPC returned empty or error
    const { data: courseRow, error: courseErr } = await supabase
      .from("courses")
      .select(`
        id,
        title,
        slug,
        summary,
        description,
        cover_url,
        status,
        created_at,
        updated_at,
        course_batches (
          id,
          title,
          slug,
          training_format,
          max_participants,
          registration_status,
          registration_closes_at,
          start_date,
          end_date,
          description,
          status,
          instructor:academy_instructors(id, full_name, title, avatar_url, expertise),
          sessions:course_sessions(id, title, session_number, starts_at, ends_at, location_type, location_detail)
        )
      `)
      .eq("slug", slug)
      .maybeSingle();

    if (courseErr || !courseRow) {
      console.error("[getPublicCourseBySlug Fallback Error]", courseErr);
      return null;
    }

    const rawBatches = (courseRow.course_batches || []).map((b: any) => ({
      ...b,
      sessions: (b.sessions || []).filter((s: any) => s.starts_at && s.ends_at),
    }));

    return {
      id: courseRow.id,
      title: courseRow.title,
      slug: courseRow.slug,
      summary: courseRow.summary,
      description: courseRow.description,
      cover_url: courseRow.cover_url,
      created_at: courseRow.created_at,
      updated_at: courseRow.updated_at,
      batches: rawBatches,
    };
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
