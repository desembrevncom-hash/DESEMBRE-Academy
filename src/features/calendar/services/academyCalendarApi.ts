import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function getPublicCalendar() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase.rpc("public_get_calendar_batches");

  if (error) {
    console.error("getPublicCalendar error:", error);
    throw error;
  }

  return data || [];
}

export async function getAdminCalendar() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  let rawSessions: any[] = [];
  try {
    const { data: sessions, error } = await supabase.rpc("admin_get_calendar");
    if (!error && Array.isArray(sessions) && sessions.length > 0) {
      rawSessions = sessions;
    }
  } catch (err) {
    console.warn("[Calendar] admin_get_calendar RPC error or missing:", err);
  }

  // Fallback to table query if RPC errored or returned empty array
  if (!rawSessions || rawSessions.length === 0) {
    console.warn("[Calendar] getAdminCalendar RPC empty/error, using direct table fallback query...");
    const { data: fallbackData, error: fallbackErr } = await supabase
      .from("course_sessions")
      .select(`
        *,
        course_batches:batch_id (
          id,
          title,
          slug,
          registration_status,
          status,
          training_format,
          courses:course_id (
            id,
            title,
            slug
          ),
          course:course_id (
            id,
            title,
            slug
          )
        )
      `)
      .order("starts_at", { ascending: true });

    if (fallbackErr) {
      console.error("[Calendar] getAdminCalendar fallback error:", fallbackErr);
      throw fallbackErr;
    }
    rawSessions = fallbackData || [];
  }

  return rawSessions
    .filter((s: any) => {
      // 1. Session must have starts_at and ends_at
      if (!s.starts_at || !s.ends_at) return false;

      const batch = s.course_batches || s.batch || s.course_batch || {};
      const course = batch.courses || batch.course || s.course || s.courses || {};

      // 2. Batch status must not be cancelled or archived
      const batchStatus = (batch.status || "").toLowerCase();
      if (batchStatus === "cancelled" || batchStatus === "archived") return false;

      // 3. Course status must not be archived
      const courseStatus = (course.status || "").toLowerCase();
      if (courseStatus === "archived") return false;

      return true;
    })
    .map((s: any) => {
      const batch = s.course_batches || s.batch || s.course_batch || {};
      const course = batch.courses || batch.course || s.course || s.courses || {};
      const instructor = batch.instructor || s.instructor || {};
      const rawSt = batch.registration_status || batch.status || s.registration_status || s.batch_status || "open";
      const regStatus = (rawSt || "open").toString().toLowerCase().trim();

      return {
        ...s,
        course_batches: {
          ...batch,
          registration_status: regStatus,
          courses: course,
          instructor: instructor,
        },
      };
    });
}

export type AttendanceStatus = 'not_marked' | 'present' | 'absent' | 'late' | 'excused';

export type SessionParticipantWithAttendance = {
  registration_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  registration_status: string;
  attendance_id: string | null;
  attendance_status: AttendanceStatus;
  checked_in_at: string | null;
  attendance_note: string | null;
};

export async function getSessionParticipantsWithAttendance(sessionId: string): Promise<SessionParticipantWithAttendance[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase.rpc("admin_get_session_participants_with_attendance", {
    p_session_id: sessionId
  });

  if (error) {
    console.error("[Calendar] getSessionParticipantsWithAttendance error:", error);
    throw error;
  }

  return data || [];
}

export async function upsertSessionAttendance(params: {
  sessionId: string;
  registrationId: string;
  status: AttendanceStatus;
  note?: string;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { error } = await supabase.rpc("admin_upsert_session_attendance", {
    p_session_id: params.sessionId,
    p_registration_id: params.registrationId,
    p_status: params.status,
    p_note: params.note || null
  });

  if (error) {
    console.error("[Calendar] upsertSessionAttendance error:", error);
    throw error;
  }
}

export async function clearSessionAttendance(params: {
  sessionId: string;
  registrationId: string;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { error } = await supabase.rpc("admin_clear_session_attendance", {
    p_session_id: params.sessionId,
    p_registration_id: params.registrationId
  });

  if (error) {
    console.error("[Calendar] clearSessionAttendance error:", error);
    throw error;
  }
}
