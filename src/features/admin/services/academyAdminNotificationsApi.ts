import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type OutboxStatus = "queued" | "processing" | "sent" | "failed" | "skipped";

export type NotificationJob = {
  id: string;
  registration_id: string;
  channel: string;
  template_code: string;
  status: OutboxStatus;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string | null;
  error_message: string | null;
  provider_message_id: string | null;
  provider_response: any | null;
  provider_status: string | null;
  delivered_at: string | null;
  seen_at: string | null;
  last_provider_event_at: string | null;
  
  // Joined fields
  lead_name: string | null;
  lead_phone: string | null;
  batch_title: string | null;
  course_title: string | null;
  sender_key: string | null;
};

export async function getAdminNotificationOutbox(): Promise<NotificationJob[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  let jobs: any[] = [];
  try {
    const { data, error } = await supabase.rpc("admin_get_notification_outbox");
    if (!error && Array.isArray(data) && data.length > 0) {
      jobs = data;
    }
  } catch (err) {
    console.warn("[Notifications] admin_get_notification_outbox RPC warning:", err);
  }

  if (!jobs || jobs.length === 0) {
    console.warn("[Notifications] getAdminNotificationOutbox using table fallback query...");
    const { data: fallbackData, error: fallbackErr } = await supabase
      .from("notification_outbox")
      .select(`
        id,
        registration_id,
        channel,
        template_code,
        payload,
        status,
        sender_key,
        attempt_count,
        max_attempts,
        error_message,
        provider_status,
        provider_message_id,
        provider_response,
        next_attempt_at,
        created_at,
        updated_at,
        sent_at,
        delivered_at,
        seen_at,
        course_registrations:registration_id (
          full_name,
          phone,
          course_batches:batch_id (
            title,
            courses:course_id (
              title
            )
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (fallbackErr) {
      console.error("[Notifications] Fallback query error:", fallbackErr);
      throw fallbackErr;
    }

    jobs = (fallbackData || []).map((row: any) => {
      const reg = row.course_registrations || {};
      const batch = reg.course_batches || {};
      const course = batch.courses || {};

      return {
        id: row.id,
        registration_id: row.registration_id,
        channel: row.channel,
        template_code: row.template_code,
        payload: row.payload,
        status: row.status,
        sender_key: row.sender_key || null,
        attempt_count: Number(row.attempt_count ?? 0),
        max_attempts: Number(row.max_attempts ?? 5),
        error_message: row.error_message || null,
        provider_status: row.provider_status || null,
        provider_message_id: row.provider_message_id || null,
        provider_response: row.provider_response || null,
        next_attempt_at: row.next_attempt_at || null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        sent_at: row.sent_at || null,
        delivered_at: row.delivered_at || null,
        seen_at: row.seen_at || null,
        lead_name: reg.full_name || null,
        lead_phone: reg.phone || null,
        batch_title: batch.title || null,
        course_title: course.title || null,
      };
    });
  }

  return jobs as NotificationJob[];
}

export async function adminRetryNotificationJob(jobId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase.rpc("admin_retry_notification_job", {
    p_job_id: jobId
  });
  
  if (error) {
    throw new Error(error.message || "Lỗi khi retry job.");
  }
  if (!data?.ok) {
    throw new Error(data?.error || "Lỗi retry job.");
  }
}

export type NotificationOpsSummary = {
  last_run_at: string | null;
  last_run_ok: boolean;
  last_run_processed: number;
  last_run_mode: string;
  last_run_triggered_by: string;
  last_success_at: string | null;
  queued_count: number;
  processing_count: number;
  stuck_count: number;
  failed_count: number;
  sent_today: number;
  delivered_today: number;
  seen_today: number;
};

export async function getNotificationOpsSummary(): Promise<NotificationOpsSummary> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase.rpc("admin_get_notification_ops_summary");
  if (error) {
    throw new Error(error.message || "Lỗi tải summary.");
  }

  return data as NotificationOpsSummary;
}

export async function requeueStuckNotificationJobs(): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase.rpc("admin_requeue_stuck_notification_jobs");
  if (error) {
    throw new Error(error.message || "Lỗi requeue.");
  }

  return data?.requeued_count || 0;
}
