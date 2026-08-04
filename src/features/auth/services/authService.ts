import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { normalizePhone, normalizeVietnamPhone, toLocalVietnamPhone } from '@/lib/phoneNormalization';

export type EligibilityCheckResult = {
  isEligible: boolean;
  registrationCount: number;
  message?: string;
};

export type OtpRequestResult = {
  ok: boolean;
  phone: string;
  isMock?: boolean;
  message?: string;
};

export const authService = {
  /**
   * Checks whether a phone number has active student access/enrollment
   * with status in ('confirmed', 'enrolled', 'paid', 'completed').
   */
  checkStudentEligibility: async (phone: string): Promise<EligibilityCheckResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { isEligible: false, registrationCount: 0, message: "Hệ thống chưa khởi tạo." };

    const normalizedE164 = normalizeVietnamPhone(phone);
    const localPhone = toLocalVietnamPhone(phone);

    if (!normalizedE164 || !localPhone) {
      return { isEligible: false, registrationCount: 0, message: "Số điện thoại không hợp lệ." };
    }

    try {
      // 1. PRIORITY 1: Query student_course_access for active access
      try {
        const { data: accesses, error: accessError } = await supabase
          .from("student_course_access")
          .select("id, access_status, expires_at")
          .or(`phone_e164.eq.${normalizedE164},phone.eq.${localPhone}`)
          .eq("access_status", "active");

        if (!accessError && accesses && accesses.length > 0) {
          const now = new Date().toISOString();
          const validAccesses = accesses.filter((a) => !a.expires_at || a.expires_at > now);
          if (validAccesses.length > 0) {
            return { isEligible: true, registrationCount: validAccesses.length };
          }
        }
      } catch (_) {}

      // 2. PRIORITY 2: Fallback query course_registrations for confirmed/enrolled/paid/completed
      const { data: registrations, error: regError } = await supabase
        .from("course_registrations")
        .select("id, phone, status, source")
        .or(`phone.eq.${normalizedE164},phone.eq.${localPhone}`)
        .in("status", ["confirmed", "enrolled", "paid", "completed"]);

      if (!regError && registrations && registrations.length > 0) {
        const validRegs = registrations.filter((r) => r.source !== "resource_download" || r.status === "paid" || r.status === "enrolled");
        if (validRegs.length > 0) {
          return { isEligible: true, registrationCount: validRegs.length };
        }
      }

      // 3. Fallback query academy_enrollments if available
      try {
        const { data: enrollments, error: enrollError } = await supabase
          .from("academy_enrollments")
          .select("id, status")
          .or(`student_phone.eq.${normalizedE164},student_phone.eq.${localPhone}`)
          .in("status", ["active", "confirmed", "enrolled", "completed"]);

        if (!enrollError && enrollments && enrollments.length > 0) {
          return { isEligible: true, registrationCount: enrollments.length };
        }
      } catch (_) {}

      return { isEligible: false, registrationCount: 0 };
    } catch (err) {
      console.error("[authService] checkStudentEligibility error:", err);
      return { isEligible: false, registrationCount: 0 };
    }
  },

  /**
   * Sends OTP to phone number or uses DEV mock fallback.
   */
  requestOtp: async (phone: string): Promise<OtpRequestResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase client not initialized");

    const normalized = normalizePhone(phone);
    if (!normalized) throw new Error("Vui lòng nhập số điện thoại hợp lệ.");

    const isDev = import.meta.env.DEV;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalized,
      });

      if (error) {
        // If SMS provider is not configured or rate-limited
        if (isDev) {
          console.warn("[authService DEV] Supabase SMS not configured or error. Falling back to Mock OTP (123456).", error.message);
          return { ok: true, phone: normalized, isMock: true };
        } else {
          // Production error UX
          throw new Error("OTP_NOT_CONFIGURED");
        }
      }

      return { ok: true, phone: normalized };
    } catch (err: any) {
      if (err.message === "OTP_NOT_CONFIGURED") {
        throw err;
      }
      if (isDev) {
        console.warn("[authService DEV] OTP request caught error. Using DEV mock OTP.", err.message);
        return { ok: true, phone: normalized, isMock: true };
      }
      throw new Error("OTP_NOT_CONFIGURED");
    }
  },

  /**
   * Verifies OTP token against phone number.
   */
  verifyOtp: async (phone: string, token: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase client not initialized");

    const normalized = normalizePhone(phone);
    if (!normalized) throw new Error("Số điện thoại không hợp lệ.");

    const isDev = import.meta.env.DEV;

    // DEV mock OTP handling
    if (isDev && token === "123456") {
      console.log("[authService DEV] Verified via mock OTP 123456.");
      return { ok: true, session: null, isMock: true };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token,
      type: 'sms',
    });

    if (error) {
      if (isDev && token === "123456") {
        return { ok: true, session: null, isMock: true };
      }
      throw error;
    }

    return { ok: true, session: data.session };
  },

  linkStudentAccount: async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        // If mock session in DEV or guest
        return { status: "linked" as const };
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/link-student-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return { status: "linked" as const };
      }

      const data = await response.json();
      return data as { status: 'linked' | 'pending_review' | 'blocked' };
    } catch (_) {
      return { status: "linked" as const };
    }
  }
};
