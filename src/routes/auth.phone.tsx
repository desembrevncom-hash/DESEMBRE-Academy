import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2, Phone, ShieldCheck, Calendar, Download, HelpCircle, AlertCircle, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/SiteHeader";
import heroImg from "@/assets/hero-instructor.jpg";
import { authService } from "@/features/auth/services/authService";
import { normalizeVietnamPhone } from "@/lib/phoneNormalization";

export const Route = createFileRoute("/auth/phone")({
  component: PhoneLogin,
});

const schema = z.object({
  phone: z.string().refine((val) => normalizeVietnamPhone(val) !== null, {
    message: "Vui lòng nhập số điện thoại hợp lệ.",
  }),
});
type FormValues = z.infer<typeof schema>;

function PhoneLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Non-eligible student state
  const [notEligibleState, setNotEligibleState] = useState<{
    phone: string;
  } | null>(null);

  // OTP not configured state
  const [otpUnconfigured, setOtpUnconfigured] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      setAuthError(null);
      setNotEligibleState(null);
      setOtpUnconfigured(false);

      const normalizedPhone = normalizeVietnamPhone(values.phone);
      if (!normalizedPhone) {
        setAuthError("Vui lòng nhập số điện thoại hợp lệ.");
        setLoading(false);
        return;
      }

      // Step 1: Check if phone has active student enrollment (confirmed/enrolled/paid/completed)
      const eligibility = await authService.checkStudentEligibility(normalizedPhone);

      if (!eligibility.isEligible) {
        setLoading(false);
        setNotEligibleState({ phone: values.phone });
        return;
      }

      // Step 2: Request OTP if eligible
      try {
        await authService.requestOtp(normalizedPhone);
        sessionStorage.setItem("academy_pending_phone", normalizedPhone);

        const searchParams = new URLSearchParams(window.location.search);
        const redirectPath = searchParams.get("redirect") || searchParams.get("returnTo");

        if (redirectPath) {
          navigate({ to: "/auth/verify-otp", search: { redirect: redirectPath } as any });
        } else {
          navigate({ to: "/auth/verify-otp" });
        }
      } catch (otpErr: any) {
        setLoading(false);
        if (otpErr.message === "OTP_NOT_CONFIGURED") {
          setOtpUnconfigured(true);
        } else {
          setAuthError("Không thể gửi mã OTP. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ.");
        }
      }
    } catch (err: any) {
      setLoading(false);
      setAuthError("Có lỗi xảy ra khi kiểm tra tài khoản. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      
      <div className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full grid overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-xl lg:grid-cols-2">
          
          {/* Left Panel: Hero Graphic */}
          <div className="relative hidden lg:block p-10 bg-slate-900 overflow-hidden">
            <div className="relative h-full flex flex-col justify-between">
              <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-40">
                <img src={heroImg} alt="DESEMBRE Academy" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              </div>

              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
                  Cổng Học Viên DESEMBRE
                </span>
              </div>

              <div className="relative z-10 text-white space-y-3">
                <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
                  Học đúng kiến thức.<br />Phát triển đúng hướng.
                </h2>
                <p className="text-sm text-slate-300 max-w-md leading-relaxed">
                  Đăng nhập bằng số điện thoại đã đăng ký khóa học để truy cập bài giảng, tài liệu chuyên sâu và lộ trình đào tạo chuẩn Y Khoa.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel: Login Form & States */}
          <div className="p-6 sm:p-10 md:p-12 flex items-center">
            <div className="w-full max-w-sm mx-auto space-y-6">
              
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
                  <Phone className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Đăng nhập học viên</h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  Nhập số điện thoại đã đăng ký học tại DESEMBRE Academy.
                </p>
              </div>

              {/* Error Message Alert */}
              {authError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="font-medium leading-relaxed">{authError}</div>
                </div>
              )}

              {/* State 1: OTP Not Configured Alert */}
              {otpUnconfigured && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Hệ thống OTP đang được cấu hình:</span>
                  </div>
                  <p className="text-amber-900 leading-relaxed">
                    Tính năng nhận mã OTP SMS đang được cấu hình trên máy chủ sản xuất. Vui lòng liên hệ bộ phận hỗ trợ học viên DESEMBRE để được hướng dẫn đăng nhập trực tiếp.
                  </p>
                  <a
                    href="https://zalo.me"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md transition-all gap-1.5"
                  >
                    <span>Liên hệ Zalo Hỗ Trợ Đăng Nhập</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* State 2: Not-Eligible Student Card (Replaces Form when phone has no confirmed enrollment) */}
              {notEligibleState ? (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 space-y-4 animate-fadeIn">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold">
                      Chưa kích hoạt tài khoản
                    </div>
                    <h3 className="text-base font-bold text-slate-900 pt-1">
                      Số điện thoại này chưa có tài khoản học viên.
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Số điện thoại <span className="font-bold text-slate-800">{notEligibleState.phone}</span> chưa có khóa học đang kích hoạt tại DESEMBRE Academy.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button
                      asChild
                      className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 gap-2 justify-between"
                    >
                      <Link to="/lich-khai-giang">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Xem lịch khai giảng khóa mới</span>
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-10 rounded-xl border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs justify-start gap-2"
                    >
                      <Link to="/tai-lieu">
                        <Download className="w-4 h-4 text-indigo-600" />
                        <span>Tải tài liệu chuyên ngành miễn phí</span>
                      </Link>
                    </Button>

                    <a
                      href="https://zalo.me"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-emerald-600" />
                      <span>Liên hệ hỗ trợ Zalo (Hotline)</span>
                    </a>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setNotEligibleState(null);
                        form.reset();
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      ← Nhập số điện thoại khác
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Phone Input Form */
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Số điện thoại Zalo
                    </label>
                    <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                      <Input
                        type="tel"
                        placeholder="VD: 0912345678"
                        className="border-0 focus-visible:ring-0 h-12 text-sm font-medium px-4"
                        autoComplete="tel"
                        {...form.register("phone")}
                      />
                    </div>
                    {form.formState.errors.phone && (
                      <p className="mt-1.5 text-xs text-rose-600 font-medium">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm h-12 shadow-lg shadow-indigo-600/25 transition-all gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Đang kiểm tra tài khoản...</span>
                      </>
                    ) : (
                      <>
                        <span>Tiếp tục</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Mã xác thực OTP sẽ được gửi qua Zalo/SMS.</span>
                  </div>

                  <div className="text-center pt-2">
                    <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                      ← Về trang chủ DESEMBRE
                    </Link>
                  </div>
                </form>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
