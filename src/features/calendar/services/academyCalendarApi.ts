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

  const { data: sessions, error } = await supabase.rpc("admin_get_calendar");

  if (error) {
    console.error("[Calendar] getAdminCalendar sessions error:", error);
    throw error;
  }

  const sessionsWithStudentCount = sessions || [];

  return sessionsWithStudentCount;
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
