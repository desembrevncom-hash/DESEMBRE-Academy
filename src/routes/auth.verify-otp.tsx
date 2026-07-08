import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { authService } from "@/features/auth/services/authService";

interface VerifyOtpSearch {
  phone?: string;
}

export const Route = createFileRoute("/auth/verify-otp")({
  validateSearch: (search: Record<string, unknown>): VerifyOtpSearch => {
    return {
      phone: typeof search.phone === 'string' ? search.phone : undefined,
    };
  },
  component: VerifyOtp,
});

function VerifyOtp() {
  const { phone } = Route.useSearch();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (!phone) {
      navigate({ to: "/auth/phone" });
    }
  }, [phone, navigate]);

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
    } catch (err) {
      setError("Không thể gửi lại mã. Vui lòng thử lại sau.");
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

      // 3. Navigate based on status
      if (linkResponse.status === 'blocked') {
        navigate({ to: "/blocked" }); // Assuming this route exists or we handle it safely
      } else if (linkResponse.status === 'pending_review') {
        navigate({ to: "/pending-review" }); // Safe landing
      } else {
        // Linked successfully -> goes to /student.
        // Or if they are admin, useAuth/useAdminAccess will naturally redirect them to /admin/courses
        navigate({ to: "/student" });
      }
    } catch (err: any) {
      // Don't leak CRM state
      setError(err.message?.includes("Invalid") || err.message?.includes("expired")
        ? "Mã OTP không đúng hoặc đã hết hạn."
        : "Xác thực thất bại. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  if (!phone) return null;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 pt-16">
        <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-[var(--shadow-soft)]">
          <div className="mx-auto w-fit rounded-2xl bg-accent p-3 text-primary-dark">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-center text-2xl font-bold">Xác thực OTP</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Nhập mã 6 số vừa được gửi đến <br />
            <span className="font-semibold text-foreground">{phone}</span>
          </p>

          {error && (
            <div className="mt-6 rounded-lg bg-error/10 p-3 text-sm text-error text-center">
              {error}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <InputOTP
              maxLength={6}
              value={token}
              onChange={(v) => {
                setToken(v);
                if (v.length === 6) setError(null);
              }}
              onComplete={() => {}}
              disabled={loading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="mt-8 space-y-4">
            <Button
              className="w-full rounded-full bg-primary hover:bg-primary-dark text-primary-foreground h-11"
              disabled={token.length < 6 || loading}
              onClick={onSubmit}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xác nhận"}
            </Button>

            <div className="flex flex-col items-center gap-2 text-sm">
              <button
                type="button"
                className="text-primary-dark disabled:text-muted-foreground disabled:cursor-not-allowed"
                disabled={cooldown > 0 || loading}
                onClick={onResend}
              >
                {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : "Gửi lại mã OTP"}
              </button>

              <Link to="/auth/phone" className="text-muted-foreground hover:text-foreground">
                Thay đổi số điện thoại
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
