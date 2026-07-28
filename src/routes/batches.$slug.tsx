import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { getPublicCourseBatchDetail, submitCourseRegistration } from "@/features/courses/services/course.service";
import type { CourseBatchDetail } from "@/features/courses/types";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Loader2, AlertCircle, CalendarDays, MapPin, Users, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export const Route = createFileRoute("/batches/$slug")({
  component: BatchLandingPage,
});

const registrationSchema = z.object({
  full_name: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  phone: z.string().regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, "Số điện thoại không hợp lệ"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  company: z.string().optional(),
  participant_role: z.string().optional(),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

function BatchLandingPage() {
  const { slug } = Route.useParams();
  const [detail, setDetail] = useState<CourseBatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      email: "",
      company: "",
      participant_role: "",
    },
  });

  useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      try {
        setLoading(true);
        const data = await getPublicCourseBatchDetail(slug);
        if (mounted) {
          if (!data || data.registration_decision?.state === "BATCH_NOT_FOUND") {
            setError("BATCH_NOT_FOUND");
          } else {
            setDetail(data);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Đã xảy ra lỗi khi tải thông tin.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    fetchDetail();
    return () => { mounted = false; };
  }, [slug]);

  const onSubmit = async (values: RegistrationFormValues) => {
    try {
      setIsSubmitting(true);
      await submitCourseRegistration(slug, values);
      setIsSuccess(true);
      toast.success("Đăng ký thành công!");
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4fbfb]">
        <SiteHeader />
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Đang tải thông tin khóa học...</p>
        </div>
      </div>
    );
  }

  if (error === "BATCH_NOT_FOUND") {
    return (
      <div className="min-h-screen bg-[#f4fbfb]">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-6 py-20 text-center flex flex-col items-center">
          <div className="rounded-full bg-accent p-6 mb-6">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Không tìm thấy lớp học</h1>
          <p className="text-muted-foreground mb-8">Lớp học bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ xuống.</p>
          <Button asChild className="rounded-full px-8">
            <Link to="/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh mục
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-[#f4fbfb]">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-6 py-20 text-center flex flex-col items-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-6">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Chưa thể tải dữ liệu</h1>
          <p className="text-muted-foreground mb-8">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="rounded-full">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  const { batch, sessions, registration_decision } = detail;
  const courseInfo = batch.course;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <SiteHeader />
      
      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-b border-indigo-900/40 overflow-hidden text-white">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px] mix-blend-screen animate-pulse" />
          <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] mix-blend-screen animate-pulse delay-1000" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-24 flex flex-col md:flex-row gap-12 items-center z-10">
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex gap-2 mb-6">
              <Badge className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 rounded-full px-4 py-1.5 font-medium backdrop-blur-md">
                Khóa học Offline / Hybrid
              </Badge>
              {batch.training_format === "zoom" && <Badge variant="outline" className="border-indigo-400/30 text-indigo-200 rounded-full backdrop-blur-md">Online qua Zoom</Badge>}
              {batch.training_format === "office" && <Badge variant="outline" className="border-indigo-400/30 text-indigo-200 rounded-full backdrop-blur-md">Tại văn phòng</Badge>}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-blue-200">
              {batch.title}
            </h1>
            
            <p className="text-indigo-200/80 md:text-lg mb-10 leading-relaxed max-w-2xl font-light">
              {batch.description || courseInfo?.marketing?.short_description || "Tham gia lớp học trực tiếp cùng chuyên gia, kết nối và thực hành thực chiến."}
            </p>
            
            <div className="flex flex-wrap gap-8 items-center text-sm font-medium">
              <div className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors duration-300">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center text-indigo-300 group-hover:scale-110 group-hover:bg-indigo-500/30 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-indigo-300/70 text-xs uppercase tracking-wider font-semibold mb-1">Khai giảng</div>
                  <div className="text-white text-base">
                    {sessions.length > 0 
                      ? format(parseISO(sessions[0].starts_at), "dd/MM/yyyy", { locale: vi })
                      : "Chưa cập nhật"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center text-blue-300 group-hover:scale-110 group-hover:bg-blue-500/30 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-blue-300/70 text-xs uppercase tracking-wider font-semibold mb-1">Sĩ số</div>
                  <div className="text-white text-base">
                    {batch.max_participants ? `Tối đa ${batch.max_participants} học viên` : "Không giới hạn"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {courseInfo?.marketing?.thumbnail_url && (
            <div className="w-full md:w-[500px] shrink-0 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group relative cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                <img 
                  src={courseInfo.marketing.thumbnail_url} 
                  alt={courseInfo.marketing.thumbnail_alt || batch.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16 -mt-10 relative z-20">
        <div className="grid md:grid-cols-[1fr_420px] gap-12">
          
          {/* Main Content */}
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            
            {/* Lịch học */}
            <section className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white shadow-xl shadow-slate-200/50">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <CalendarDays className="h-5 w-5" />
                </div>
                Lịch trình chi tiết
              </h2>
              
              {sessions.length === 0 ? (
                <div className="bg-slate-50/50 rounded-2xl p-8 text-center text-muted-foreground border border-slate-100">
                  Chưa có lịch trình cho lớp học này.
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.4rem] md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500/20 before:via-indigo-500/40 before:to-indigo-500/5">
                  {sessions.map((session, index) => {
                    const startDate = parseISO(session.starts_at);
                    const endDate = parseISO(session.ends_at);
                    return (
                      <div key={session.id} className="relative flex items-start md:items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        {/* Timeline dot */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-slate-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white group-hover:border-indigo-100 shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-all duration-300 mt-2 md:mt-0 ml-[1px] md:ml-0">
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-300 transform group-hover:-translate-y-1">
                          <div className="inline-flex px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold mb-3 border border-indigo-100/50">
                            {format(startDate, "EEEE, dd/MM", { locale: vi })}
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-indigo-900 transition-colors">{session.title}</h3>
                          <div className="flex flex-col gap-2 text-sm text-slate-600">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                <CalendarDays className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                              </div>
                              <span className="font-medium text-slate-700">{format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                <MapPin className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                              </div>
                              <span className="truncate font-medium text-slate-700" title={session.location_detail || session.location_type}>
                                {session.location_detail || session.location_type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            
          </div>
          
          {/* Sidebar / Registration Form */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
            <div className="sticky top-24">
              <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-8 border border-white shadow-2xl shadow-slate-300/60 relative overflow-hidden group">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-40 h-40 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
                
                {isSuccess ? (
                  <div className="text-center py-10 animate-in zoom-in duration-500">
                    <div className="mx-auto w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 border border-emerald-100">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Đăng ký thành công!</h3>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                      Cảm ơn bạn đã đăng ký. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận thông tin.
                    </p>
                    <Button asChild className="w-full rounded-full h-12 bg-slate-900 hover:bg-slate-800 text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
                      <Link to="/courses">Khám phá thêm khóa học</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 to-blue-800 mb-2">Đăng ký giữ chỗ</h3>
                      <p className="text-sm text-slate-500 font-medium">
                        Để lại thông tin để chúng tôi liên hệ tư vấn chi tiết cho bạn.
                      </p>
                    </div>
                    
                    {!registration_decision.can_register ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center shadow-inner">
                        <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-4" />
                        <p className="font-semibold text-slate-700">
                          {registration_decision.state === "BATCH_FULL" && "Lớp học đã đủ sĩ số."}
                          {registration_decision.state === "REGISTRATION_CLOSED" && "Đã hết hạn đăng ký."}
                          {registration_decision.state === "REGISTRATION_NOT_OPEN_YET" && "Chưa mở đăng ký."}
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
                        <div className="space-y-2.5">
                          <Label htmlFor="full_name" className="text-slate-700 font-semibold">Họ và tên <span className="text-rose-500">*</span></Label>
                          <Input 
                            id="full_name" 
                            placeholder="Nhập họ và tên" 
                            {...register("full_name")}
                            className={`bg-white/50 border-slate-200 h-12 px-4 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.full_name ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500" : ""}`}
                          />
                          {errors.full_name && <p className="text-xs text-rose-500 font-medium">{errors.full_name.message}</p>}
                        </div>
                        
                        <div className="space-y-2.5">
                          <Label htmlFor="phone" className="text-slate-700 font-semibold">Số điện thoại <span className="text-rose-500">*</span></Label>
                          <Input 
                            id="phone" 
                            placeholder="Nhập số điện thoại" 
                            {...register("phone")}
                            className={`bg-white/50 border-slate-200 h-12 px-4 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.phone ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500" : ""}`}
                          />
                          {errors.phone && <p className="text-xs text-rose-500 font-medium">{errors.phone.message}</p>}
                        </div>
                        
                        <div className="space-y-2.5">
                          <Label htmlFor="email" className="text-slate-700 font-semibold">Email <span className="text-slate-400 font-normal">(Tùy chọn)</span></Label>
                          <Input 
                            id="email" 
                            type="email"
                            placeholder="Nhập địa chỉ email" 
                            {...register("email")}
                            className={`bg-white/50 border-slate-200 h-12 px-4 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.email ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500" : ""}`}
                          />
                          {errors.email && <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2.5">
                            <Label htmlFor="company" className="text-slate-700 font-semibold text-sm line-clamp-1">Công ty <span className="text-slate-400 font-normal">(Tùy chọn)</span></Label>
                            <Input 
                              id="company" 
                              placeholder="Nhập tên CTy" 
                              {...register("company")}
                              className="bg-white/50 border-slate-200 h-12 px-4 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                          </div>
                          
                          <div className="space-y-2.5">
                            <Label htmlFor="participant_role" className="text-slate-700 font-semibold text-sm line-clamp-1">Chức vụ <span className="text-slate-400 font-normal">(Tùy chọn)</span></Label>
                            <Input 
                              id="participant_role" 
                              placeholder="VD: Quản lý" 
                              {...register("participant_role")}
                              className="bg-white/50 border-slate-200 h-12 px-4 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                          </div>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full rounded-xl h-14 mt-8 text-base font-bold text-white shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group" 
                          disabled={isSubmitting}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 transition-transform duration-300 group-hover:scale-105" />
                          <div className="relative flex items-center justify-center w-full h-full">
                            {isSubmitting ? (
                              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang xử lý...</>
                            ) : (
                              <>Đăng ký ngay <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                            )}
                          </div>
                        </Button>
                        <p className="text-xs text-center text-slate-500 mt-5 font-medium px-4">
                          Bằng việc đăng ký, bạn đồng ý với các <a href="#" className="text-indigo-600 hover:underline">điều khoản dịch vụ</a> của chúng tôi.
                        </p>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
