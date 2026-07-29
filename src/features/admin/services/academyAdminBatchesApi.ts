import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseEnvironment } from "@/lib/supabase/env";

export async function adminGetCourseBatches() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");
  
  const env = getSupabaseEnvironment();
  console.log("[Admin Batches project]", env.url);

  const { data, error } = await supabase.rpc("admin_get_course_batches");
  if (error) {
    console.warn("[adminGetCourseBatches RPC error, falling back to table query]:", error);
    // Fallback to table select if RPC not updated yet
    const { data: fallbackData, error: fallbackErr } = await supabase
      .from("course_batches")
      .select("*, course:courses(id, title, slug), instructor:academy_instructors(id, full_name, title)")
      .order("created_at", { ascending: false });

    if (fallbackErr) throw fallbackErr;
    console.log("[Admin Batches raw]", fallbackData);
    return fallbackData;
  }
  console.log("[Admin Batches raw]", data);
  return data;
}

export async function adminCreateCourseBatch(payload: any) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");
  
  const regStatus = (payload.registration_status || "open").toString().toLowerCase().trim();

  try {
    const { data, error } = await supabase.rpc("admin_create_course_batch", {
      p_course_id: payload.course_id,
      p_title: payload.title,
      p_slug: payload.slug,
      p_training_format: payload.training_format,
      p_max_participants: payload.max_participants || null,
      p_registration_status: regStatus,
      p_start_date: payload.start_date || null,
      p_end_date: payload.end_date || null,
      p_description: payload.description || null,
      p_instructor_id: payload.instructor_id || null,
      p_registration_closes_at: payload.registration_closes_at || null,
    });
    
    if (!error) return data;
    console.warn("[adminCreateCourseBatch RPC error, attempting direct insert]:", error);
  } catch (e) {
    console.warn("[adminCreateCourseBatch RPC exception, fallback to direct insert]", e);
  }

  // Direct insert fallback
  const { data, error } = await supabase
    .from("course_batches")
    .insert({
      course_id: payload.course_id,
      title: payload.title,
      slug: payload.slug,
      training_format: payload.training_format,
      max_participants: payload.max_participants || null,
      registration_status: regStatus,
      start_date: payload.start_date || null,
      end_date: payload.end_date || null,
      description: payload.description || null,
      instructor_id: payload.instructor_id || null,
      registration_closes_at: payload.registration_closes_at || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function adminUpdateCourseBatch(id: string, payload: any) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");
  
  const regStatus = (payload.registration_status || "open").toString().toLowerCase().trim();

  try {
    const { data, error } = await supabase.rpc("admin_update_course_batch", {
      p_batch_id: id,
      p_course_id: payload.course_id,
      p_title: payload.title,
      p_slug: payload.slug,
      p_training_format: payload.training_format,
      p_max_participants: payload.max_participants || null,
      p_registration_status: regStatus,
      p_start_date: payload.start_date || null,
      p_end_date: payload.end_date || null,
      p_description: payload.description || null,
      p_instructor_id: payload.instructor_id || null,
      p_registration_closes_at: payload.registration_closes_at || null,
    });
    
    if (!error) return data;
    console.warn("[adminUpdateCourseBatch RPC error, attempting direct update]:", error);
  } catch (e) {
    console.warn("[adminUpdateCourseBatch RPC exception, fallback to direct update]", e);
  }

  // Direct update fallback
  const { data, error } = await supabase
    .from("course_batches")
    .update({
      course_id: payload.course_id,
      title: payload.title,
      slug: payload.slug,
      training_format: payload.training_format,
      max_participants: payload.max_participants || null,
      registration_status: regStatus,
      start_date: payload.start_date || null,
      end_date: payload.end_date || null,
      description: payload.description || null,
      instructor_id: payload.instructor_id || null,
      registration_closes_at: payload.registration_closes_at || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

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
