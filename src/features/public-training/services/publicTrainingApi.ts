import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface PublicInstructorInfo {
  id: string;
  full_name: string;
  title: string | null;
  avatar_url: string | null;
  expertise?: string[];
}

export interface PublicSessionInfo {
  id: string;
  title: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location_type: string | null;
  location_detail: string | null;
  description?: string | null;
}

export interface PublicCourseBatch {
  id: string;
  title: string;
  slug: string;
  training_format: string | null;
  max_participants: number | null;
  registration_status: string | null;
  registration_closes_at: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  confirmed_count: number;
  pending_count: number;
  course: {
    id: string;
    title: string;
    slug: string;
    cover_url: string | null;
    summary: string | null;
  };
  instructor: PublicInstructorInfo | null;
  sessions: PublicSessionInfo[];
}

export interface SubmitPublicRegistrationPayload {
  batchId: string;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface SubmitPublicRegistrationResponse {
  ok: boolean;
  duplicate?: boolean;
  registration_id?: string;
  message?: string;
  error?: string;
}

export async function getPublicTrainingSchedule(): Promise<PublicCourseBatch[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    console.error("[getPublicTrainingSchedule] Supabase client is null (SSR context or client init failed)");
    return [];
  }

  const { getSupabaseEnvironment } = await import("@/lib/supabase/env");
  const env = getSupabaseEnvironment();
  console.log("[Public Training RPC project]", env.url);

  const { data, error } = await supabase.rpc("public_get_training_schedule");

  if (error) {
    console.error("[getPublicTrainingSchedule RPC Error]", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`[RPC Error ${error.code || '404'}]: ${error.message} (Hint: ${error.hint || 'Check Grants & Schema Reload'})`);
  }

  return data || [];
}

export async function submitPublicCourseRegistration(
  payload: SubmitPublicRegistrationPayload
): Promise<SubmitPublicRegistrationResponse> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client unavailable");

  const { data, error } = await supabase.rpc("public_submit_course_registration", {
    p_batch_id: payload.batchId,
    p_full_name: payload.fullName,
    p_phone: payload.phone,
    p_email: payload.email || null,
    p_notes: payload.notes || null,
  });

  if (error) {
    console.error("[submitPublicCourseRegistration RPC Error]", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    // Graceful fallback for unique constraint violation (duplicate registration)
    if (
      error.code === "23505" ||
      error.message?.includes("course_registrations_unique_batch_phone") ||
      error.message?.includes("unique constraint") ||
      error.details?.includes("already exists")
    ) {
      return { ok: true, duplicate: true, message: "ALREADY_REGISTERED" };
    }

    throw new Error(`[RPC Error ${error.code || '404'}]: ${error.message} (Hint: ${error.hint || 'Check Grants & Signature'})`);
  }

  if (data && data.ok === false) {
    if (data.duplicate || data.message === "ALREADY_REGISTERED" || data.error?.includes("unique constraint")) {
      return { ok: true, duplicate: true, message: "ALREADY_REGISTERED" };
    }
    throw new Error(data.error || "Đăng ký không thành công");
  }

  return (data || { ok: true }) as SubmitPublicRegistrationResponse;
}
