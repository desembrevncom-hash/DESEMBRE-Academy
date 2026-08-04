import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, KeyRound, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { authService } from "@/features/auth/services/authService";
import { maskPhone } from "@/utils/privacy";

export const Route = createFileRoute("/auth/verify-otp")({
  component: VerifyOtp,
});

function VerifyOtp() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    const storedPhone = sessionStorage.getItem("academy_pending_phone");
    if (!storedPhone) {
      navigate({ to: "/auth/phone" });
    } else {
      setPhone(storedPhone);
    }
  }, [navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const onResend = async () => {
    if (cooldown > 0 || !phone) return;
    try {
      setLoading(true);
      setError(null);
      await authService.requestOtp(phone);
      setCooldown(60);
    } catch (err: any) {
      if (err?.message === "OTP_NOT_CONFIGURED") {
        setError("Tính năng OTP đang được cấu hình. Vui lòng liên hệ DESEMBRE để được hỗ trợ đăng nhập.");
      } else {
        setError("Không thể gửi lại mã OTP. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    if (token.length < 6 || !phone) return;
    try {
      setLoading(true);
      setError(null);

      // 1. Verify OTP
      await authService.verifyOtp(phone, token);

      // 2. Link student account safely
      const linkResponse = await authService.linkStudentAccount();

      // Clean up session storage
      sessionStorage.removeItem("academy_pending_phone");

      // 3. Navigate based on status
      if (linkResponse.status === 'blocked') {
        navigate({ to: "/blocked" as any });
      } else if (linkResponse.status === 'pending_review') {
        navigate({ to: "/pending-review" as any });
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectPath = searchParams.get("redirect") || searchParams.get("returnTo");

        if (redirectPath && redirectPath.startsWith("/") && !redirectPath.startsWith("//")) {
          navigate({ to: redirectPath as any });
        } else {
          navigate({ to: "/student" });
        }
      }
    } catch (err: any) {
      if (err?.message?.includes("OTP_NOT_CONFIGURED")) {
        setError("Tính năng OTP đang được cấu hình. Vui lòng liên hệ DESEMBRE để được hỗ trợ đăng nhập.");
      } else {
        setError(
          err.message?.includes("Invalid") || err.message?.includes("expired")
            ? "Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại."
            : "Xác thực thất bại. Vui lòng kiểm tra mã OTP và thử lại."
        );
      }
      setLoading(false);
    }
  };

  if (!phone) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <div className="flex-1 mx-auto max-w-md w-full px-4 py-12 flex items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl space-y-6">
          
          <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <KeyRound className="h-6 w-6" />
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Xác thực mã OTP</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nhập mã 6 số vừa được gửi đến SĐT Zalo <br />
              <span className="font-bold text-slate-800 font-mono text-sm">{maskPhone(phone)}</span>
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center font-medium animate-fadeIn">
              {error}
            </div>
          )}

          <div className="flex justify-center py-2">
            <InputOTP
              maxLength={6}
              value={token}
              onChange={(v) => {
                setToken(v);
                if (v.length === 6) setError(null);
              }}
              disabled={loading}
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} className="w-11 h-12 rounded-xl text-base font-bold border-slate-200" />
                <InputOTPSlot index={1} className="w-11 h-12 rounded-xl text-base font-bold border-slate-200" />
                <InputOTPSlot index={2} className="w-11 h-12 rounded-xl text-base font-bold border-slate-200" />
                <InputOTPSlot index={3} className="w-11 h-12 rounded-xl text-base font-bold border-slate-200" />
                <InputOTPSlot index={4} className="w-11 h-12 rounded-xl text-base font-bold border-slate-200" />
                <InputOTPSlot index={5} className="w-11 h-12 rounded-xl text-base font-bold border-slate-200" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all gap-2"
              disabled={token.length < 6 || loading}
              onClick={onSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận đăng nhập</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="flex flex-col items-center gap-2 pt-2 text-xs">
              <button
                type="button"
                className="font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                disabled={cooldown > 0 || loading}
                onClick={onResend}
              >
                {cooldown > 0 ? `Gửi lại mã OTP sau ${cooldown}s` : "Gửi lại mã OTP"}
              </button>

              <button
                type="button"
                className="text-slate-500 hover:text-slate-900 transition-colors"
                onClick={() => {
                  sessionStorage.removeItem("academy_pending_phone");
                  navigate({ to: "/auth/phone" });
                }}
              >
                ← Thay đổi số điện thoại
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
