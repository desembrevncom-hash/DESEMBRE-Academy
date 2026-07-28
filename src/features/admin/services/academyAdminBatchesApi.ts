import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function adminGetCourseBatches() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");
  
  const { data, error } = await supabase.rpc("admin_get_course_batches");
  if (error) throw error;
  return data;
}

export async function adminCreateCourseBatch(payload: any) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");
  
  const { data, error } = await supabase.rpc("admin_create_course_batch", {
    p_course_id: payload.course_id,
    p_title: payload.title,
    p_slug: payload.slug,
    p_training_format: payload.training_format,
    p_max_participants: payload.max_participants || null,
    p_registration_status: payload.registration_status,
    p_start_date: payload.start_date || null,
    p_end_date: payload.end_date || null,
    p_description: payload.description || null
  });
  
  if (error) throw error;
  return data;
}

export async function adminUpdateCourseBatch(id: string, payload: any) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");
  
  const { data, error } = await supabase.rpc("admin_update_course_batch", {
    p_batch_id: id,
    p_course_id: payload.course_id,
    p_title: payload.title,
    p_slug: payload.slug,
    p_training_format: payload.training_format,
    p_max_participants: payload.max_participants || null,
    p_registration_status: payload.registration_status,
    p_start_date: payload.start_date || null,
    p_end_date: payload.end_date || null,
    p_description: payload.description || null
  });
  
  if (error) throw error;
  return data;
}

export async function adminGetBatchRegistrations(batchId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");
  
  const { data, error } = await supabase.rpc("admin_get_batch_registrations", {
    p_batch_id: batchId
  });
  
  if (error) throw error;
  return data;
}
