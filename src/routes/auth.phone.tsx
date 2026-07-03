import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { useAppStore } from "@/lib/store";
import heroImg from "@/assets/hero-instructor.jpg";

export const Route = createFileRoute("/auth/phone")({
  component: PhoneAuth,
});

const schema = z.object({
  phone: z
    .string()
    .min(9, "Số điện thoại tối thiểu 9 chữ số")
    .max(11, "Số điện thoại tối đa 11 chữ số")
    .regex(/^[0-9]+$/, "Chỉ được nhập số"),
  agree: z.literal(true, { errorMap: () => ({ message: "Vui lòng đồng ý với điều khoản" }) }),
});
type FormValues = z.infer<typeof schema>;

function PhoneAuth() {
  const navigate = useNavigate();
  const { requestOtp } = useAppStore();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", agree: false as unknown as true },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    requestOtp(`+84${values.phone.replace(/^0/, "")}`);
    setLoading(false);
    navigate({ to: "/auth/verify-otp" });
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
                <div className="mt-2 text-3xl font-bold leading-tight">Học đúng kiến thức. Phát triển đúng hướng.</div>
                <p className="mt-3 max-w-sm text-white/85">Đăng nhập bằng số điện thoại để tiếp tục hành trình học tập của bạn.</p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="mx-auto max-w-sm">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-primary-dark">
                <Phone className="h-5 w-5" />
              </div>
              <h1 className="mt-5 text-2xl font-bold">Đăng nhập</h1>
              <p className="mt-1 text-sm text-muted-foreground">Nhập số điện thoại của bạn, chúng tôi sẽ gửi mã OTP xác thực.</p>

              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
                <div>
                  <label className="text-sm font-medium">Số điện thoại</label>
                  <div className="mt-1.5 flex overflow-hidden rounded-2xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                    <span className="grid place-items-center px-4 text-sm text-muted-foreground bg-accent">+84</span>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="912 345 678"
                      className="border-0 rounded-none focus-visible:ring-0 h-11"
                      autoComplete="tel"
                      {...form.register("phone")}
                    />
                  </div>
                  {form.formState.errors.phone && (
                    <p className="mt-1 text-xs text-error">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="agree"
                    checked={form.watch("agree") as boolean}
                    onCheckedChange={(v) => form.setValue("agree", v as true, { shouldValidate: true })}
                  />
                  <label htmlFor="agree" className="text-sm text-muted-foreground leading-relaxed">
                    Tôi đồng ý với <span className="text-primary-dark underline">Điều khoản sử dụng</span> và <span className="text-primary-dark underline">Chính sách bảo mật</span> của DESEMBRE Academy.
                  </label>
                </div>
                {form.formState.errors.agree && (
                  <p className="text-xs text-error">{form.formState.errors.agree.message as string}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-primary hover:bg-primary-dark text-primary-foreground h-11"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gửi mã OTP"}
                </Button>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Thông tin đăng nhập được bảo mật theo tiêu chuẩn DESEMBRE.
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  Chưa có tài khoản? Chỉ cần nhập số điện thoại — chúng tôi sẽ tự động tạo hồ sơ. <br />
                  <Link to="/" className="text-primary-dark">Về trang chủ</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
