import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getPublicCourseBatches } from "@/features/courses/services/course.service";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Loader2, AlertCircle, BookOpen, CalendarDays, MapPin, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/batches/")({
  component: BatchesIndexPage,
});

function BatchesIndexPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchBatches() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicCourseBatches();
        if (mounted) {
          setBatches(data || []);
        }
      } catch (err: any) {
        if (mounted) {
          let errorMessage = "Đã xảy ra lỗi khi tải danh sách lớp học.";
          if (err === "NETWORK" || err?.message === "NETWORK") {
            errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra lại.";
          } else if (err?.message) {
            errorMessage = err.message;
          }
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchBatches();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <SiteHeader />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-b border-indigo-900/40 overflow-hidden text-white pt-16 pb-24 text-center">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] mix-blend-screen animate-pulse" />
          <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] mix-blend-screen animate-pulse delay-1000" />
        </div>
        
        <div className="relative z-10 px-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          <p className="mb-6 inline-flex rounded-full bg-indigo-500/20 px-4 py-1.5 text-sm font-semibold text-indigo-200 border border-indigo-400/30 backdrop-blur-md">
            Khóa học Offline & Online
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-blue-200 mb-6">
            Lịch Khai Giảng
          </h1>
          <p className="text-indigo-200/80 md:text-lg mb-8 leading-relaxed font-light">
            Cập nhật lịch khai giảng các khóa học thực chiến mới nhất từ DESEMBRE Academy. Đăng ký sớm để giữ chỗ và nhận ưu đãi!
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 -mt-10 relative z-20">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-slate-200/50">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
            <p className="text-slate-600 font-medium">Đang tải lịch khai giảng...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-slate-200/50">
            <div className="rounded-full bg-rose-100 p-4 mb-4 shadow-inner">
              <AlertCircle className="h-10 w-10 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa thể tải dữ liệu</h3>
            <p className="text-slate-500 mb-8 max-w-md text-center">{error}</p>
            <Button onClick={() => window.location.reload()} className="rounded-full px-8 h-12 bg-slate-900 hover:bg-slate-800 transition-all shadow-md">
              Thử lại ngay
            </Button>
          </div>
        )}

        {!loading && !error && batches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-slate-200/50">
            <div className="rounded-full bg-slate-100 p-5 mb-5 shadow-inner">
              <BookOpen className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có lớp học nào</h3>
            <p className="text-slate-500 text-center max-w-md">
              Hiện tại chưa có lịch khai giảng nào được công bố. Vui lòng quay lại sau.
            </p>
          </div>
        )}

        {!loading && !error && batches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {batches.map((batch, index) => (
              <div 
                key={batch.id || index}
                className="group relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-8"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Image Section */}
                <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                  {batch.course?.marketing?.thumbnail_url ? (
                    <img 
                      src={batch.course.marketing.thumbnail_url} 
                      alt={batch.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <BookOpen className="h-12 w-12" />
                    </div>
                  )}
                  
                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {batch.training_format === 'office' && (
                      <Badge className="bg-white/90 text-indigo-700 border-0 shadow-sm backdrop-blur-md">
                        Tại văn phòng
                      </Badge>
                    )}
                    {batch.training_format === 'zoom' && (
                      <Badge className="bg-white/90 text-blue-700 border-0 shadow-sm backdrop-blur-md">
                        Online / Zoom
                      </Badge>
                    )}
                    {batch.registration_status === 'OPEN' && (
                      <Badge className="bg-emerald-500/90 text-white border-0 shadow-sm backdrop-blur-md">
                        Đang mở đăng ký
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wide">
                    {batch.course?.title || "Khóa học chuyên môn"}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                    {batch.title}
                  </h3>
                  
                  <div className="space-y-3 mt-auto mb-6">
                    <div className="flex items-center text-sm text-slate-600">
                      <CalendarDays className="h-4 w-4 mr-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      <span>{batch.start_date ? format(parseISO(batch.start_date), "dd/MM/yyyy", { locale: vi }) : "Đang cập nhật lịch"}</span>
                    </div>
                    {batch.max_participants && (
                      <div className="flex items-center text-sm text-slate-600">
                        <Users className="h-4 w-4 mr-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        <span>Giới hạn {batch.max_participants} học viên</span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    asChild 
                    className="w-full rounded-xl h-12 bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200 hover:border-transparent shadow-sm transition-all duration-300 group/btn"
                  >
                    <Link to="/batches/$slug" params={{ slug: batch.slug }}>
                      Xem chi tiết
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
