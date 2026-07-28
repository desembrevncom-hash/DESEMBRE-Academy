import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type RegistrationStatus =
  | "pending"
  | "contacted"
  | "confirmed"
  | "rejected"
  | "cancelled";

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
    console.warn("[getAllCourseRegistrations RPC error, fallback to direct query]", error);
    let query = supabase
      .from("course_registrations")
      .select("*, batch:course_batches(id, title, slug, training_format, start_date, course:courses(id, title))")
      .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters?.batchId) {
      query = query.eq("batch_id", filters.batchId);
    }
    if (filters?.source && filters.source !== "all") {
      query = query.eq("source", filters.source);
    }
    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data: fallbackData, error: fallbackErr } = await query;
    if (fallbackErr) throw fallbackErr;
    return (fallbackData || []).map((r: any) => ({
      ...r,
      batch_title: r.batch?.title,
      batch_slug: r.batch?.slug,
      training_format: r.batch?.training_format,
      start_date: r.batch?.start_date,
      course_title: r.batch?.course?.title,
      note: r.note || r.notes,
    }));
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
    "Họ tên", "Số điện thoại", "Email", "Khóa học", "Lớp / Batch", "Nguồn", "Ghi chú khách",
    "Trạng thái", "Ghi chú admin", "Ngày đăng ký", "Ngày liên hệ", "Ngày xác nhận"
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
    escapeCsvCell(lead.note || lead.notes),
    escapeCsvCell(lead.status),
    escapeCsvCell(lead.admin_note),
    escapeCsvCell(lead.created_at),
    escapeCsvCell(lead.contacted_at),
    escapeCsvCell(lead.confirmed_at),
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
