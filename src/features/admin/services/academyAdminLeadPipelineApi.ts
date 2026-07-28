import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type RegistrationStatus =
  | "pending"
  | "contacted"
  | "confirmed"
  | "rejected"
  | "cancelled";

export type FollowUpStatus =
  | "new"
  | "need_call"
  | "contacted"
  | "callback_scheduled"
  | "no_answer"
  | "qualified"
  | "unqualified"
  | "won"
  | "lost";

export type LeadQuality = "hot" | "warm" | "cold" | "unknown";

export type BatchRegistrationLead = {
  id: string;
  batch_id: string;
  batch_slug?: string | null;
  batch_title?: string | null;
  course_title?: string | null;
  full_name: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  participant_role?: string | null;
  source?: string | null;
  note?: string | null;
  notes?: string | null;
  status: RegistrationStatus;
  admin_note?: string | null;
  contacted_at?: string | null;
  confirmed_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  training_format?: string | null;
  start_date?: string | null;
  assigned_to?: string | null;
  assigned_to_email?: string | null;
  follow_up_status?: FollowUpStatus | string | null;
  next_follow_up_at?: string | null;
  last_contacted_at?: string | null;
  internal_note?: string | null;
  lead_quality?: LeadQuality | string | null;
  lost_reason?: string | null;
};

export type LeadInsightData = {
  ok: boolean;
  error?: string;
  history: Array<{
    id: string;
    old_status: string | null;
    new_status: string | null;
    note: string | null;
    created_at: string;
    actor_email: string | null;
  }>;
  outbox: Array<{
    id: string;
    channel: string;
    status: string;
    sent_at: string | null;
    created_at: string;
  }>;
  past_registrations: Array<{
    id: string;
    batch_title: string;
    course_title: string;
    status: string;
    created_at: string;
  }>;
};

export async function getAllCourseRegistrations(filters?: {
  status?: string | null;
  search?: string | null;
  batchId?: string | null;
  source?: string | null;
}): Promise<BatchRegistrationLead[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase.rpc("admin_get_all_course_registrations", {
    p_status: filters?.status || null,
    p_search: filters?.search || null,
    p_batch_id: filters?.batchId || null,
    p_source: filters?.source || null,
  });

  if (error) {
    console.error("[getAllCourseRegistrations] RPC failed:", {
      code: error.code,
      message: error.message,
      details: (error as any).details,
      hint: (error as any).hint,
    });
    throw new Error(
      `Không thể tải danh sách đăng ký: ${error.message || "Lỗi RPC không xác định"}` +
      ((error as any).hint ? ` (Hint: ${(error as any).hint})` : "")
    );
  }

  return (data || []) as BatchRegistrationLead[];
}

export async function getBatchRegistrations(batchId: string): Promise<BatchRegistrationLead[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase.rpc("admin_get_batch_registrations", {
    p_batch_id: batchId,
  });

  if (error) {
    throw new Error(error.message || "Lỗi khi lấy danh sách đăng ký. Vui lòng kiểm tra lại schema hoặc RPC.");
  }

  return (data || []) as BatchRegistrationLead[];
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: RegistrationStatus,
  adminNote?: string | null
): Promise<{ ok: boolean; status?: string; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase.rpc("admin_update_course_registration_status", {
    p_registration_id: registrationId,
    p_status: status,
    p_admin_note: adminNote || null,
  });

  if (error) {
    console.warn("[updateRegistrationStatus primary RPC error, trying alias]", error);
    const { data: aliasData, error: aliasErr } = await supabase.rpc("admin_update_registration_status", {
      p_registration_id: registrationId,
      p_status: status,
      p_admin_note: adminNote || null,
    });
    if (aliasErr) throw new Error(aliasErr.message || "Lỗi khi cập nhật trạng thái.");
    return aliasData;
  }

  if (data && !data.ok) {
    throw new Error(data.error || "Cập nhật thất bại.");
  }

  return data;
}

export interface UpdateFollowUpPayload {
  registrationId: string;
  followUpStatus: string;
  nextFollowUpAt?: string | null;
  internalNote?: string | null;
  leadQuality?: string | null;
  assignedTo?: string | null;
  assignedToEmail?: string | null;
  lostReason?: string | null;
}

export async function updateRegistrationFollowUp(
  payload: UpdateFollowUpPayload
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase.rpc("admin_update_registration_follow_up", {
    p_registration_id: payload.registrationId,
    p_follow_up_status: payload.followUpStatus,
    p_next_follow_up_at: payload.nextFollowUpAt || null,
    p_internal_note: payload.internalNote || null,
    p_lead_quality: payload.leadQuality || null,
    p_assigned_to: payload.assignedTo || null,
    p_assigned_to_email: payload.assignedToEmail || null,
    p_lost_reason: payload.lostReason || null,
  });

  if (error) {
    console.warn("[updateRegistrationFollowUp RPC error, fallback to direct query]", error);
    const { error: fallbackErr } = await supabase
      .from("course_registrations")
      .update({
        follow_up_status: payload.followUpStatus,
        next_follow_up_at: payload.nextFollowUpAt || null,
        internal_note: payload.internalNote || null,
        lead_quality: payload.leadQuality || null,
        assigned_to: payload.assignedTo || null,
        assigned_to_email: payload.assignedToEmail || null,
        lost_reason: payload.lostReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.registrationId);

    if (fallbackErr) throw new Error(fallbackErr.message || "Lỗi khi cập nhật chăm sóc lead.");
    return { ok: true };
  }

  if (data && !data.ok) {
    throw new Error(data.error || "Cập nhật thất bại.");
  }

  return data;
}

export async function getRegistrationsByPhone(phone: string): Promise<BatchRegistrationLead[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");
  if (!phone) return [];

  const { data, error } = await supabase.rpc("admin_get_registrations_by_phone", {
    p_phone: phone,
  });

  if (error) {
    console.warn("[getRegistrationsByPhone RPC error, fallback to direct query]", error);
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const { data: fallbackData, error: fallbackErr } = await supabase
      .from("course_registrations")
      .select("*, batch:course_batches(id, title, slug, training_format, course:courses(id, title))")
      .order("created_at", { ascending: false });

    if (fallbackErr) return [];
    return (fallbackData || [])
      .filter((r: any) => (r.phone || "").replace(/[^0-9]/g, "") === cleanPhone)
      .map((r: any) => ({
        ...r,
        batch_title: r.batch?.title,
        batch_slug: r.batch?.slug,
        training_format: r.batch?.training_format,
        course_title: r.batch?.course?.title,
      }));
  }

  return (data || []) as BatchRegistrationLead[];
}

export async function getLeadInsights(registrationId: string): Promise<LeadInsightData> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("UNAUTHENTICATED");

  const { data, error } = await supabase.rpc("admin_get_lead_insights", {
    p_registration_id: registrationId,
  });

  if (error) {
    throw new Error(error.message || "Lỗi khi lấy thông tin lead.");
  }

  return data as LeadInsightData;
}

export function exportRegistrationsToCsv(leads: BatchRegistrationLead[], batchTitleOrId: string) {
  if (!leads.length) return;

  const headers = [
    "Họ tên", "Số điện thoại", "Email", "Khóa học", "Lớp / Batch", "Nguồn",
    "Chất lượng", "Trạng thái chăm sóc", "Người phụ trách", "Lịch hẹn", "Ghi chú khách",
    "Trạng thái đăng ký", "Lý do thất bại", "Ngày đăng ký"
  ];

  const escapeCsvCell = (value: unknown) => {
    const text = String(value ?? "").replace(/"/g, '""');
    return `"${text}"`;
  };

  const formatPhoneForCsv = (phone: string | null | undefined) => {
    const value = String(phone ?? "").trim();
    if (!value) return "";
    return `="${value.replace(/"/g, '""')}"`;
  };

  const rows = leads.map(lead => [
    escapeCsvCell(lead.full_name),
    formatPhoneForCsv(lead.phone),
    escapeCsvCell(lead.email),
    escapeCsvCell(lead.course_title),
    escapeCsvCell(lead.batch_title),
    escapeCsvCell(lead.source),
    escapeCsvCell(lead.lead_quality),
    escapeCsvCell(lead.follow_up_status),
    escapeCsvCell(lead.assigned_to_email),
    escapeCsvCell(lead.next_follow_up_at),
    escapeCsvCell(lead.note || lead.notes),
    escapeCsvCell(lead.status),
    escapeCsvCell(lead.lost_reason),
    escapeCsvCell(lead.created_at),
  ].join(","));

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date().toISOString().split("T")[0];
  const safeName = batchTitleOrId.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  
  link.setAttribute("href", url);
  link.setAttribute("download", `registrations-${safeName}-${dateStr}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
