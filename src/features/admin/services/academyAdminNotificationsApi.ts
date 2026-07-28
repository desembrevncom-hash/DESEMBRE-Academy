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

  const { data, error } = await supabase.rpc("admin_get_notification_outbox");
  if (error) {
    throw new Error(error.message || "Lỗi tải danh sách outbox.");
  }

  return (data || []) as NotificationJob[];
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
