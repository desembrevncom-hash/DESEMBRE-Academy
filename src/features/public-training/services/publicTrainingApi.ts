import { createClient } from "@supabase/supabase-js";
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
  source?: string;
  campaign_slug?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
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

  const rawBatches = (data || []) as PublicCourseBatch[];
  console.log('[PublicTraining] raw schedule from RPC', rawBatches);

  // Hard filter client-side: MUST have sessions array with at least 1 valid session containing starts_at and ends_at
  const cleanBatches = rawBatches.filter((batch) => {
    return Array.isArray(batch.sessions)
      && batch.sessions.some((session) => Boolean(session.starts_at) && Boolean(session.ends_at));
  });

  console.log('[PublicTraining] clean schedule after hard filtering 0-session batches', cleanBatches);
  return cleanBatches;
}

export async function submitPublicCourseRegistration(
  payload: SubmitPublicRegistrationPayload
): Promise<SubmitPublicRegistrationResponse> {
  let supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const url = process.env.VITE_SUPABASE_URL || "https://ynmcoeapfycijblydyuw.supabase.co";
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_QIWQKhXRvEOQ57t-gEep-g_qsiKFs09";
    supabase = createClient(url, key);
  }

  // Attempt RPC with extended parameters (p_source, p_campaign_slug, utm_*)
  let rpcRes = await supabase.rpc("public_submit_course_registration", {
    p_batch_id: payload.batchId,
    p_full_name: payload.fullName,
    p_phone: payload.phone,
    p_email: payload.email || null,
    p_notes: payload.notes || null,
    p_source: payload.source || 'public_schedule',
    p_campaign_slug: payload.campaign_slug || null,
    p_utm_source: payload.utm_source || null,
    p_utm_medium: payload.utm_medium || null,
    p_utm_campaign: payload.utm_campaign || null,
  });

  // Fallback: If DB RPC signature is old (5 params), try calling with 5 params and append tracking info to p_notes
  if (rpcRes.error && (rpcRes.error.code === "PGRST202" || rpcRes.error.message?.includes("function") || rpcRes.error.code === "42883")) {
    console.warn("[submitPublicCourseRegistration] Extended RPC signature not found, falling back to 5-param RPC with notes attribution");

    let attributionNotes = payload.notes || "";
    if (payload.campaign_slug) attributionNotes += ` [campaign: ${payload.campaign_slug}]`;
    if (payload.utm_source) attributionNotes += ` [utm_source: ${payload.utm_source}]`;
    if (payload.utm_medium) attributionNotes += ` [utm_medium: ${payload.utm_medium}]`;
    if (payload.utm_campaign) attributionNotes += ` [utm_campaign: ${payload.utm_campaign}]`;

    rpcRes = await supabase.rpc("public_submit_course_registration", {
      p_batch_id: payload.batchId,
      p_full_name: payload.fullName,
      p_phone: payload.phone,
      p_email: payload.email || null,
      p_notes: attributionNotes.trim() || null,
    });
  }

  const { data, error } = rpcRes;

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
