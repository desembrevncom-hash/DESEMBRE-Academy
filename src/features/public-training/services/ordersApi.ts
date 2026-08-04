import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizeVietnamPhone, toLocalVietnamPhone } from "@/lib/phoneNormalization";

export interface AcademyOrder {
  id: string;
  registration_id: string | null;
  course_id: string | null;
  batch_id: string | null;
  full_name: string;
  phone: string;
  phone_e164: string | null;
  email: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: "pending_payment" | "paid" | "failed" | "cancelled" | "refunded";
  payment_note: string | null;
  bank_transfer_content: string | null;
  proof_url: string | null;
  paid_at: string | null;
  confirmed_by: string | null;
  created_at: string;
}

export interface StudentCourseAccess {
  id: string;
  order_id: string | null;
  registration_id: string | null;
  course_id: string;
  batch_id: string | null;
  phone: string;
  phone_e164: string | null;
  access_status: "active" | "expired" | "revoked";
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

export interface CreateOrderPayload {
  registrationId?: string;
  courseId?: string;
  batchId?: string;
  fullName: string;
  phone: string;
  email?: string;
  amount: number;
}

export const ordersApi = {
  /**
   * Creates a manual payment order for paid course registrations.
   */
  async createPaidCourseOrder(payload: CreateOrderPayload): Promise<{ ok: boolean; order?: AcademyOrder; message?: string }> {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { ok: false, message: "Hệ thống chưa kết nối." };

    const e164 = normalizeVietnamPhone(payload.phone);
    const localPhone = toLocalVietnamPhone(payload.phone) || payload.phone;
    const transferContent = `DESEMBRE ${localPhone.replace(/[^\d]/g, "")}`;

    try {
      const { data, error } = await supabase
        .from("academy_orders")
        .insert([
          {
            registration_id: payload.registrationId || null,
            course_id: payload.courseId || null,
            batch_id: payload.batchId || null,
            full_name: payload.fullName,
            phone: localPhone,
            phone_e164: e164,
            email: payload.email || null,
            amount: payload.amount,
            payment_method: "bank_transfer",
            payment_status: "pending_payment",
            bank_transfer_content: transferContent,
          },
        ])
        .select("*")
        .single();

      if (error) {
        console.error("[ordersApi] createPaidCourseOrder error:", error.message);
        return { ok: false, message: error.message };
      }

      return { ok: true, order: data as AcademyOrder };
    } catch (err: any) {
      console.error("[ordersApi] Exception creating order:", err);
      return { ok: false, message: err.message };
    }
  },

  /**
   * Fetches active student_course_access records matching phone.
   */
  async getStudentActiveAccess(phone: string): Promise<StudentCourseAccess[]> {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return [];

    const e164 = normalizeVietnamPhone(phone);
    const local = toLocalVietnamPhone(phone);

    try {
      const { data, error } = await supabase
        .from("student_course_access")
        .select("*")
        .or(`phone_e164.eq.${e164 || phone},phone.eq.${local || phone}`)
        .eq("access_status", "active");

      if (error) {
        console.warn("[ordersApi] getStudentActiveAccess error:", error.message);
        return [];
      }

      const now = new Date().toISOString();
      // Filter non-expired access
      return ((data || []) as StudentCourseAccess[]).filter((access) => {
        if (!access.expires_at) return true;
        return access.expires_at > now;
      });
    } catch (_) {
      return [];
    }
  },

  /**
   * Fetches order associated with a registration_id.
   */
  async getOrderByRegistrationId(registrationId: string): Promise<AcademyOrder | null> {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from("academy_orders")
        .select("*")
        .eq("registration_id", registrationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return data as AcademyOrder;
    } catch (_) {
      return null;
    }
  },

  /**
   * Admin action: Confirm payment for an order and activate student course access via SECURITY DEFINER RPC.
   */
  async adminConfirmPayment(payload: {
    orderId?: string;
    registrationId?: string;
    courseId?: string;
    batchId?: string;
    phone: string;
    fullName?: string;
    confirmedBy?: string;
  }): Promise<{ ok: boolean; message?: string; access_id?: string; order_id?: string }> {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { ok: false, message: "No Supabase client." };

    if (!payload.registrationId) {
      return { ok: false, message: "Thiếu ID đơn đăng ký (registrationId)." };
    }

    try {
      // Execute SECURITY DEFINER RPC
      const { data, error } = await supabase.rpc("admin_confirm_paid_and_open_access", {
        p_registration_id: payload.registrationId,
      });

      if (error) {
        console.error("[ordersApi] admin_confirm_paid_and_open_access RPC error:", error);
        return { ok: false, message: `Lỗi RPC Supabase: ${error.message}` };
      }

      const res = data as {
        ok: boolean;
        order_id?: string;
        access_id?: string;
        message?: string;
      };

      if (!res || !res.ok || !res.access_id) {
        return {
          ok: false,
          message: res?.message || "RPC không ghi nhận được student_course_access vào CSDL.",
        };
      }

      return {
        ok: true,
        message: res.message || "Đã xác nhận thanh toán & mở quyền học viên thành công!",
        access_id: res.access_id,
        order_id: res.order_id,
      };
    } catch (err: any) {
      console.error("[ordersApi] adminConfirmPayment exception:", err);
      return { ok: false, message: err.message };
    }
  },

  /**
   * Admin action: Cancel an order.
   */
  async adminCancelOrder(orderId: string): Promise<{ ok: boolean }> {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { ok: false };

    await supabase
      .from("academy_orders")
      .update({
        payment_status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return { ok: true };
  }
};
