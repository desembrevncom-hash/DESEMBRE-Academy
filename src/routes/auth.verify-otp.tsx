import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/verify-otp")({
  component: VerifyOtp,
});

function VerifyOtp() {
  const navigate = useNavigate();
  const { pendingPhone, verifyOtp, requestOtp } = useAppStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!pendingPhone) navigate({ to: "/auth/phone" });
  }, [pendingPhone, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const submit = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 400));
    const ok = verifyOtp(code);
    setLoading(false);
    if (!ok) {
      setError("Mã OTP không đúng. Vui lòng thử lại.");
      return;
    }
    toast.success("Đăng nhập thành công");
    navigate({ to: "/student" });
  };

  const resend = () => {
    if (countdown > 0 || !pendingPhone) return;
    requestOtp(pendingPhone);
    setCountdown(60);
    toast.info("Đã gửi lại mã OTP");
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-[var(--shadow-soft)]">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-primary-dark">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Xác thực OTP</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhập mã 6 chữ số đã gửi tới {pendingPhone ?? "số điện thoại của bạn"}.
          </p>
          <div className="mt-2 rounded-xl bg-accent px-3 py-2 text-xs text-primary-dark">
            Mã OTP demo: <span className="font-semibold">123456</span>
          </div>

          <div className="mt-8 flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="h-12 w-12 rounded-xl border-border text-lg" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && <p className="mt-4 text-center text-sm text-error">{error}</p>}

          <Button
            onClick={submit}
            disabled={loading || code.length !== 6}
            className="mt-6 w-full rounded-full bg-primary hover:bg-primary-dark text-primary-foreground h-11"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xác thực và đăng nhập"}
          </Button>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={resend}
              disabled={countdown > 0}
              className="text-primary-dark disabled:text-muted-foreground"
            >
              {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại mã"}
            </button>
            <Link to="/auth/phone" className="text-muted-foreground hover:text-foreground">Đổi số điện thoại</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
