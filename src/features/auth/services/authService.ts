import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { normalizeVietnamPhone, toLocalVietnamPhone } from '@/lib/phoneNormalization';

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
   * Checks whether a phone number has active student access/enrollment.
   */
  checkStudentEligibility: async (phone: string): Promise<EligibilityCheckResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { isEligible: false, registrationCount: 0, message: "Hệ thống chưa khởi tạo." };

    try {
      // Execute SECURITY DEFINER RPC to bypass RLS and check student access
      const { data, error } = await supabase.rpc("check_student_phone_access", {
        p_phone: phone,
      });

      if (!error && data) {
        const res = data as {
          ok: boolean;
          phone_e164?: string;
          course_count?: number;
          courses?: any[];
          message?: string;
        };

        if (res.ok && (res.course_count || 0) > 0) {
          return {
            isEligible: true,
            registrationCount: res.course_count || 0,
            message: res.message,
          };
        }
      }

      // If RPC fails or returns ok=false, fallback check via direct queries
      const normalizedE164 = normalizeVietnamPhone(phone);
      const localPhone = toLocalVietnamPhone(phone);

      if (normalizedE164 && localPhone) {
        const { data: registrations, error: regError } = await supabase
          .from("course_registrations")
          .select("id, phone, status, source")
          .or(`phone.eq.${normalizedE164},phone.eq.${localPhone}`)
          .in("status", ["confirmed", "enrolled", "paid", "completed"]);

        if (!regError && registrations && registrations.length > 0) {
          return { isEligible: true, registrationCount: registrations.length };
        }
      }

      return { isEligible: false, registrationCount: 0 };
    } catch (err) {
      console.error("[authService] checkStudentEligibility error:", err);
      return { isEligible: false, registrationCount: 0 };
    }
  },

  /**
   * Sends OTP to phone number or uses RPC OTP provider.
   */
  requestOtp: async (phone: string): Promise<OtpRequestResult> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase client not initialized");

    const isDev = import.meta.env.DEV;

    try {
      // Execute SECURITY DEFINER RPC to create OTP (safe, single parameter p_phone)
      const { data, error } = await supabase.rpc("create_student_login_otp", {
        p_phone: phone,
      });

      if (error) {
        console.warn("[authService] create_student_login_otp RPC error:", error.message);
        // Fallback to Supabase Auth OTP if RPC not applied yet
        const { error: supaErr } = await supabase.auth.signInWithOtp({ phone });
        if (supaErr) {
          if (isDev) return { ok: true, phone, isMock: true };
          throw new Error("OTP_NOT_CONFIGURED");
        }
        return { ok: true, phone };
      }

      const res = data as {
        ok: boolean;
        phone_e164?: string;
        message?: string;
      };

      if (!res || !res.ok) {
        if (isDev) return { ok: true, phone, isMock: true };
        throw new Error(res?.message || "OTP_NOT_CONFIGURED");
      }

      return { ok: true, phone: res.phone_e164 || phone };
    } catch (err: any) {
      if (err.message === "OTP_NOT_CONFIGURED" || err.message === "NOT_ELIGIBLE") {
        throw err;
      }
      if (isDev) {
        console.warn("[authService DEV] OTP request caught error. Using DEV mock OTP.", err.message);
        return { ok: true, phone, isMock: true };
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

    const isDev = import.meta.env.DEV;

    // DEV mock OTP handling
    if (isDev && token === "123456") {
      console.log("[authService DEV] Verified via mock OTP 123456.");
      const studentSession = {
        phone_e164: phone,
        login_at: new Date().toISOString(),
      };
      sessionStorage.setItem("academy_student_session", JSON.stringify(studentSession));
      localStorage.setItem("academy_student_session", JSON.stringify(studentSession));
      return { ok: true, session: null, isMock: true };
    }

    try {
      const { data, error } = await supabase.rpc("verify_student_login_otp", {
        p_phone: phone,
        p_otp: token,
      });

      if (!error && data) {
        const res = data as {
          ok: boolean;
          phone_e164?: string;
          courses?: any[];
          message?: string;
        };

        if (res.ok) {
          const studentSession = {
            phone_e164: res.phone_e164 || phone,
            courses: res.courses || [],
            login_at: new Date().toISOString(),
          };
          sessionStorage.setItem("academy_student_session", JSON.stringify(studentSession));
          localStorage.setItem("academy_student_session", JSON.stringify(studentSession));
          return { ok: true, session: null, studentSession };
        } else {
          throw new Error(res.message || "Mã OTP không chính xác hoặc đã hết hạn.");
        }
      }

      // Supabase auth OTP fallback
      const { data: supaData, error: supaError } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      });

      if (supaError) throw supaError;
      return { ok: true, session: supaData.session };
    } catch (err: any) {
      if (isDev && token === "123456") {
        const studentSession = {
          phone_e164: phone,
          login_at: new Date().toISOString(),
        };
        sessionStorage.setItem("academy_student_session", JSON.stringify(studentSession));
        localStorage.setItem("academy_student_session", JSON.stringify(studentSession));
        return { ok: true, session: null, isMock: true };
      }
      throw err;
    }
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
