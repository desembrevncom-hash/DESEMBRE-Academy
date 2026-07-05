import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/SiteHeader";
import heroImg from "@/assets/hero-instructor.jpg";
import { authService } from "@/features/auth/services/auth.service";
import { useAuth } from "@/features/auth/useAuth";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});
type FormValues = z.infer<typeof schema>;

function Login() {
  const navigate = useNavigate();
  const { session, loading: authLoading, initialized } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (initialized && session) {
      navigate({ to: "/student", replace: true });
    }
  }, [initialized, session, navigate]);

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      setAuthError(null);
      await authService.signInWithPassword(values.email, values.password);
      navigate({ to: "/student" });
    } catch (err: any) {
      setAuthError(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        <div className="grid overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-[var(--shadow-soft)] lg:grid-cols-2">
          <div className="relative hidden lg:block hero-bg p-10">
            <div className="relative h-full">
              <div className="absolute inset-0 rounded-3xl overflow-hidden">
                <img src={heroImg} alt="" className="h-full w-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/50 via-primary/10 to-transparent" />
              </div>
              <div className="relative flex h-full flex-col justify-end p-8 text-white">
                <div className="text-xs uppercase tracking-widest opacity-90">DESEMBRE Academy</div>
                <div className="mt-2 text-3xl font-bold leading-tight">
                  Học đúng kiến thức. Phát triển đúng hướng.
                </div>
                <p className="mt-3 max-w-sm text-white/85">
                  Đăng nhập để tiếp tục hành trình học tập của bạn.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="mx-auto max-w-sm">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-primary-dark">
                <Mail className="h-5 w-5" />
              </div>
              <h1 className="mt-5 text-2xl font-bold">Đăng nhập</h1>
              <p className="mt-1 text-sm text-muted-foreground">Nhập email và mật khẩu của bạn.</p>

              {authError && (
                <div className="mt-4 rounded-lg bg-error/10 p-3 text-sm text-error">
                  {authError}
                </div>
              )}

              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <div className="mt-1.5 flex overflow-hidden rounded-2xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      className="border-0 focus-visible:ring-0 h-11"
                      autoComplete="email"
                      {...form.register("email")}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="mt-1 text-xs text-error">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Mật khẩu</label>
                  <div className="mt-1.5 flex overflow-hidden rounded-2xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="border-0 focus-visible:ring-0 h-11"
                      autoComplete="current-password"
                      {...form.register("password")}
                    />
                  </div>
                  {form.formState.errors.password && (
                    <p className="mt-1 text-xs text-error">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || authLoading}
                  className="w-full rounded-full bg-primary hover:bg-primary-dark text-primary-foreground h-11"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đăng nhập"}
                </Button>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Thông tin đăng nhập được bảo mật theo tiêu chuẩn DESEMBRE.
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <Link to="/" className="text-primary-dark">
                    Về trang chủ
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
