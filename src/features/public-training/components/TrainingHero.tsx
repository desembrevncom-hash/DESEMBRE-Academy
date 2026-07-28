import { Calendar, Sparkles, GraduationCap, ArrowDown, MessageSquareCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrainingHero() {
  const scrollToSchedule = () => {
    const el = document.getElementById("schedule-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white py-16 sm:py-20 md:py-24">
      {/* Background glow & aesthetic lights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-500/15 blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-70" />
      </div>

      <div className="relative container mx-auto px-4 max-w-5xl text-center">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs sm:text-sm font-semibold mb-6 backdrop-blur-md shadow-lg shadow-indigo-950/40">
          <GraduationCap className="h-4 w-4 text-indigo-400" />
          <span>DESEMBRE ACADEMY</span>
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
        </div>

        {/* Main Headings */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5 leading-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
          Lịch Đào Tạo Chuyên Sâu
        </h1>

        <p className="text-indigo-200/80 text-sm sm:text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed px-2">
          Cập nhật các lớp khai giảng, workshop và chương trình đào tạo chuyên môn cùng đội ngũ chuyên gia DESEMBRE. Nâng tầm tay nghề và phát triển sự nghiệp Spa/Thẩm mỹ.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10 max-w-md mx-auto">
          <Button
            onClick={scrollToSchedule}
            className="w-full sm:w-auto h-12 px-7 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 transition-all duration-200"
          >
            <span>Xem lịch khai giảng</span>
            <ArrowDown className="ml-2 w-4 h-4" />
          </Button>

          <Button
            onClick={scrollToSchedule}
            variant="outline"
            className="w-full sm:w-auto h-12 px-7 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm transition-all duration-200"
          >
            <MessageSquareCheck className="mr-2 w-4 h-4 text-indigo-300" />
            <span>Tư vấn lộ trình</span>
          </Button>
        </div>

        {/* Micro Features Bar */}
        <div className="inline-flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs sm:text-sm text-indigo-200/80 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Cập nhật liên tục</span>
          </div>

          <div className="hidden sm:block w-1 h-1 rounded-full bg-indigo-400/40" />

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Đăng ký trực tuyến</span>
          </div>

          <div className="hidden sm:block w-1 h-1 rounded-full bg-indigo-400/40" />

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>Xác nhận qua Zalo / Điện thoại</span>
          </div>
        </div>
      </div>
    </section>
  );
}
