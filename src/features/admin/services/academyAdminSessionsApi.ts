import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface AdminSession {
  id: string;
  batch_id: string;
  title: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location_type: string;
  location_detail: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  status: string;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
}

export interface CreateSessionPayload {
  batch_id: string;
  title: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  location_type?: string;
  location_detail?: string | null;
  order_index?: number;
}

export interface UpdateSessionPayload {
  title: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  location_type?: string;
  location_detail?: string | null;
  order_index?: number;
}

export async function adminGetBatchSessions(batchId: string): Promise<AdminSession[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  // Try RPC first, fall back to direct query if RPC not yet deployed
  const { data, error } = await supabase.rpc("admin_get_batch_sessions", {
    p_batch_id: batchId,
  });

  if (error) {
    // Fallback: direct query (RPC may not be deployed yet)
    console.warn("admin_get_batch_sessions RPC not available, falling back to direct query:", error.message);
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("course_sessions")
      .select("*")
      .eq("batch_id", batchId)
      .order("starts_at", { ascending: true });
    if (fallbackError) throw fallbackError;
    return (fallbackData || []) as AdminSession[];
  }

  return (data || []) as AdminSession[];
}

export const getBatchSessions = adminGetBatchSessions;
export const createBatchSession = adminCreateSession;
export const updateBatchSession = adminUpdateSession;
export const deleteBatchSession = adminDeleteSession;

export async function adminCreateSession(payload: CreateSessionPayload): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase.rpc("admin_create_course_session", {
    p_batch_id: payload.batch_id,
    p_title: payload.title,
    p_description: payload.description || null,
    p_starts_at: payload.starts_at || null,
    p_ends_at: payload.ends_at || null,
    p_location_type: payload.location_type || "office",
    p_location_detail: payload.location_detail || null,
    p_order_index: payload.order_index ?? 0,
  });

  if (error) {
    // Fallback: direct insert
    console.warn("admin_create_course_session RPC not available, using direct insert:", error.message);
    const { data: insertData, error: insertError } = await supabase
      .from("course_sessions")
      .insert({
        batch_id: payload.batch_id,
        title: payload.title,
        description: payload.description || null,
        starts_at: payload.starts_at || null,
        ends_at: payload.ends_at || null,
        location_type: payload.location_type || "office",
        location_detail: payload.location_detail || null,
        order_index: payload.order_index ?? 0,
      })
      .select("id")
      .single();
    if (insertError) throw insertError;
    return (insertData as any).id;
  }

  return data as string;
}

export async function adminUpdateSession(sessionId: string, payload: UpdateSessionPayload): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { error } = await supabase.rpc("admin_update_course_session", {
    p_session_id: sessionId,
    p_title: payload.title,
    p_description: payload.description || null,
    p_starts_at: payload.starts_at || null,
    p_ends_at: payload.ends_at || null,
    p_location_type: payload.location_type || "office",
    p_location_detail: payload.location_detail || null,
    p_order_index: payload.order_index ?? 0,
  });

  if (error) {
    // Fallback: direct update
    console.warn("admin_update_course_session RPC not available, using direct update:", error.message);
    const { error: updateError } = await supabase
      .from("course_sessions")
      .update({
        title: payload.title,
        description: payload.description || null,
        starts_at: payload.starts_at || null,
        ends_at: payload.ends_at || null,
        location_type: payload.location_type || "office",
        location_detail: payload.location_detail || null,
        order_index: payload.order_index ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
    if (updateError) throw updateError;
  }
}

export async function adminDeleteSession(sessionId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { error } = await supabase.rpc("admin_delete_course_session", {
    p_session_id: sessionId,
  });

  if (error) {
    // Fallback: direct delete
    console.warn("admin_delete_course_session RPC not available, using direct delete:", error.message);
    const { error: deleteError } = await supabase
      .from("course_sessions")
      .delete()
      .eq("id", sessionId);
    if (deleteError) throw deleteError;
  }
}

export async function adminMarkSessionCompleted(sessionId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");
  const { error } = await supabase.rpc("admin_mark_session_completed", { p_session_id: sessionId });
  if (error) {
    console.warn("RPC admin_mark_session_completed failed, using direct update:", error.message);
    const { error: updateError } = await supabase
      .from("course_sessions")
      .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (updateError) throw updateError;
  }
}

export async function adminCancelSession(sessionId: string, reason?: string | null): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");
  const { error } = await supabase.rpc("admin_cancel_session", { p_session_id: sessionId, p_reason: reason || null });
  if (error) {
    console.warn("RPC admin_cancel_session failed, using direct update:", error.message);
    const { error: updateError } = await supabase
      .from("course_sessions")
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: reason || null, updated_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (updateError) throw updateError;
  }
}

export async function adminReopenSession(sessionId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");
  const { error } = await supabase.rpc("admin_reopen_session", { p_session_id: sessionId });
  if (error) {
    console.warn("RPC admin_reopen_session failed, using direct update:", error.message);
    const { error: updateError } = await supabase
      .from("course_sessions")
      .update({ status: 'scheduled', completed_at: null, cancelled_at: null, cancellation_reason: null, updated_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (updateError) throw updateError;
  }
}
