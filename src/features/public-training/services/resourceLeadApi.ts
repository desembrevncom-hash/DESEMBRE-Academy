import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizeVietnamPhone } from "@/lib/phoneNormalization";

export interface ResourceLeadPayload {
  fullName: string;
  phone: string;
  email?: string;
  resourceSlug: string;
  resourceTitle: string;
}

export interface ResourceLeadResult {
  ok: boolean;
  message?: string;
  downloadUrl?: string;
}

export async function submitResourceLead(payload: ResourceLeadPayload): Promise<ResourceLeadResult> {
  const normalizedPhone = normalizeVietnamPhone(payload.phone);
  if (!normalizedPhone) {
    throw new Error("Vui lòng nhập số điện thoại hợp lệ.");
  }

  const supabase = getSupabaseBrowserClient();
  const notes = `[resource: ${payload.resourceSlug}] ${payload.resourceTitle}`;

  if (supabase) {
    try {
      // 1. Try inserting directly into course_registrations or calling registration RPC
      const { error } = await supabase.from("course_registrations").insert([
        {
          full_name: payload.fullName,
          phone: normalizedPhone,
          email: payload.email || null,
          source: "resource_download",
          notes: notes,
          status: "pending",
        },
      ]);

      if (error) {
        console.warn("[submitResourceLead] Direct insert note/warn:", error.message);
      }
    } catch (err) {
      console.warn("[submitResourceLead] Caught error, proceeding to grant download link:", err);
    }
  }

  // Sample production download link generator
  const downloadUrl = `https://training.desembre-vn.com/assets/resources/${payload.resourceSlug}.pdf`;

  return {
    ok: true,
    downloadUrl: downloadUrl,
    message: "Đăng ký tải tài liệu thành công!",
  };
}
