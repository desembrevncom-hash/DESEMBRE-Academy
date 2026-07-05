import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/student/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { student, logout } = useAppStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl hero-bg border border-border/60 p-8 flex items-center gap-5">
        <Avatar className="h-20 w-20"><AvatarFallback className="bg-primary/20 text-primary-dark text-xl">{student.fullName.slice(0, 1)}</AvatarFallback></Avatar>
        <div>
          <h1 className="text-2xl font-bold">{student.fullName}</h1>
          <p className="text-muted-foreground text-sm">Tham gia từ {new Date(student.joinedAt).toLocaleDateString("vi-VN")}</p>
        </div>
      </div>

      <section className="rounded-3xl border border-border/70 bg-card p-6">
        <h2 className="text-lg font-semibold">Thông tin cá nhân</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Họ và tên</Label>
            <Input defaultValue={student.fullName} className="mt-1.5 rounded-xl h-11" />
          </div>
          <div>
            <Label>Số điện thoại</Label>
            <Input value={student.phone} disabled className="mt-1.5 rounded-xl h-11 bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">Số điện thoại không thể chỉnh sửa trực tiếp.</p>
          </div>
          <div>
            <Label>Email</Label>
            <Input defaultValue={student.email} className="mt-1.5 rounded-xl h-11" />
          </div>
          <div>
            <Label>Công ty</Label>
            <Input defaultValue={student.company} className="mt-1.5 rounded-xl h-11" />
          </div>
          <div>
            <Label>Chức vụ</Label>
            <Input defaultValue={student.jobTitle} className="mt-1.5 rounded-xl h-11" />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground"
            onClick={() => toast.success("Đã cập nhật hồ sơ")}
          >
            Cập nhật hồ sơ
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Bell className="h-5 w-5 text-primary-dark" /> Thiết lập thông báo</h2>
        <div className="mt-5 space-y-4">
          {[
            { label: "Nhắc nhở học tập hằng ngày", d: true },
            { label: "Thông báo khóa học mới", d: true },
            { label: "Bản tin từ DESEMBRE Academy", d: false },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <div className="text-sm">{s.label}</div>
              <Switch defaultChecked={s.d} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-primary-dark" /> Chính sách bảo mật</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Chúng tôi bảo vệ thông tin của bạn theo các tiêu chuẩn bảo mật cao nhất. Xem chi tiết tại trang chính sách bảo mật.
        </p>
      </section>

      <Separator />

      <Button
        variant="outline"
        className="rounded-full text-error border-error/40 hover:bg-error/5"
        onClick={() => {
          logout();
          navigate({ to: "/" });
        }}
      >
        <LogOut className="h-4 w-4" /> Đăng xuất
      </Button>
    </div>
  );
}
