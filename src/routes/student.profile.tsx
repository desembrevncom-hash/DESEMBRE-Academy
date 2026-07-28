import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Shield, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/useAuth";
import { useStudent } from "@/features/student/useStudent";
import { authService } from "@/features/auth/services/auth.service";
import { maskPhone } from "@/utils/privacy";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { studentService } from "@/features/student/services/student.service";

export const Route = createFileRoute("/student/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { session, user } = useAuth();
  const { studentAccount } = useStudent();
  const navigate = useNavigate();

  const metadata = user?.user_metadata || {};
  
  const [fullName, setFullName] = useState(metadata.full_name || studentAccount?.display_name || "");
  const [email, setEmail] = useState(metadata.contact_email || metadata.email || user?.email || "");
  const [company, setCompany] = useState(metadata.company || "");
  const [jobTitle, setJobTitle] = useState(metadata.job_title || "");
  const [isSaving, setIsSaving] = useState(false);

  const displayFullName = fullName || "Học viên (chưa cập nhật)";
  const joinedDate = studentAccount?.created_at 
    ? new Date(studentAccount.created_at).toLocaleDateString("vi-VN") 
    : "Chưa cập nhật";

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("No client");
      
      const { error } = await client.auth.updateUser({
        data: {
          full_name: fullName,
          contact_email: email,
          company: company,
          job_title: jobTitle
        }
      });
      
      if (studentAccount?.id) {
        await client.from('academy_student_accounts').update({ display_name: fullName }).eq('id', studentAccount.id);
      }
      
      if (error) throw error;
      toast.success("Đã cập nhật hồ sơ");
    } catch (err) {
      toast.error("Lỗi khi cập nhật hồ sơ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    window.location.href = "/";
  };

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      if (session) {
        setLoadingHistory(true);
        try {
          const res = await studentService.getStudentLearningHistory();
          setHistory(res);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingHistory(false);
        }
      }
    }
    loadHistory();
  }, [session]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">Chờ xác nhận</span>;
      case "contacted": return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Đã liên hệ</span>;
      case "confirmed": return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">Thành công</span>;
      case "rejected": 
      case "cancelled": return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">Đã huỷ</span>;
      default: return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl hero-bg border border-border/60 p-8 flex items-center gap-5">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="bg-primary/20 text-primary-dark text-xl">
            {displayFullName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{displayFullName}</h1>
          <p className="text-muted-foreground text-sm">
            Tham gia từ {joinedDate}
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-border/70 bg-card p-6">
        <h2 className="text-lg font-semibold">Lịch sử đăng ký khóa học</h2>
        <div className="mt-5">
          {loadingHistory ? (
             <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : history.length === 0 ? (
             <div className="text-center p-8 border border-dashed rounded-xl bg-slate-50 text-slate-500">
               Chưa có lịch sử đăng ký khóa học nào.
             </div>
          ) : (
             <div className="space-y-4">
               {history.map(item => (
                 <div key={item.id} className="border rounded-xl p-4 bg-slate-50 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                         <h3 className="font-bold text-slate-800">{item.course?.title}</h3>
                         <div className="text-sm text-slate-600">Lớp: {item.batch?.title}</div>
                       </div>
                       {getStatusLabel(item.status)}
                    </div>
                    
                    {item.sessions && item.sessions.length > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Lịch học chi tiết</div>
                        <ul className="space-y-2">
                           {item.sessions.map((s: any, idx: number) => (
                             <li key={s.id} className="flex gap-4 text-xs">
                               <div className="w-6 h-6 rounded-full bg-white border flex items-center justify-center font-semibold text-slate-500 shrink-0">{idx + 1}</div>
                               <div className="flex flex-col text-slate-600">
                                  <span>{s.starts_at ? new Date(s.starts_at).toLocaleString("vi-VN", {dateStyle: "short", timeStyle: "short"}) : "TBA"}</span>
                                  <span className="text-[10px] text-muted-foreground">{s.location_type}</span>
                               </div>
                             </li>
                           ))}
                        </ul>
                      </div>
                    )}
                 </div>
               ))}
             </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-6">
        <h2 className="text-lg font-semibold">Thông tin cá nhân</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Họ và tên</Label>
            <Input 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              placeholder="Học viên (chưa cập nhật)"
              className="mt-1.5 rounded-xl h-11" 
            />
          </div>
          <div>
            <Label>Số điện thoại</Label>
            <Input 
              value={studentAccount?.phone ? maskPhone(studentAccount.phone) : "+84••••••••"} 
              disabled 
              className="mt-1.5 rounded-xl h-11 bg-muted" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              Số điện thoại không thể chỉnh sửa trực tiếp.
            </p>
          </div>
          <div>
            <Label>Email</Label>
            <Input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Chưa cập nhật"
              className="mt-1.5 rounded-xl h-11" 
            />
          </div>
          <div>
            <Label>Công ty</Label>
            <Input 
              value={company} 
              onChange={(e) => setCompany(e.target.value)} 
              placeholder="Chưa cập nhật"
              className="mt-1.5 rounded-xl h-11" 
            />
          </div>
          <div>
            <Label>Chức vụ</Label>
            <Input 
              value={jobTitle} 
              onChange={(e) => setJobTitle(e.target.value)} 
              placeholder="Chưa cập nhật"
              className="mt-1.5 rounded-xl h-11" 
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground min-w-[140px]"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Cập nhật hồ sơ
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary-dark" /> Thiết lập thông báo
        </h2>
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
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary-dark" /> Chính sách bảo mật
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Chúng tôi bảo vệ thông tin của bạn theo các tiêu chuẩn bảo mật cao nhất. Xem chi tiết tại
          trang chính sách bảo mật.
        </p>
      </section>

      <Separator />

      <Button
        variant="outline"
        className="rounded-full text-error border-error/40 hover:bg-error/5"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" /> Đăng xuất
      </Button>
    </div>
  );
}
