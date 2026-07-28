import { Calendar, Sparkles, GraduationCap } from "lucide-react";

export function TrainingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white py-16 md:py-24">
      {/* Decorative backdrop elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-60" />
      </div>

      <div className="relative container mx-auto px-4 max-w-5xl text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs sm:text-sm font-medium mb-6 backdrop-blur-md shadow-lg shadow-indigo-950/50">
          <GraduationCap className="h-4 w-4 text-indigo-400" />
          <span>DESEMBRE ACADEMY TRAINING</span>
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
          Lịch Đào Tạo DESEMBRE Academy
        </h1>

        <p className="text-indigo-200/80 text-base sm:text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
          Khám phá và đăng ký các khoá đào tạo chuyên sâu chuẩn Y Khoa & Thẩm mỹ cao cấp. Nâng cao tay nghề cùng các chuyên gia hàng đầu.
        </p>

        <div className="flex flex-wrap justify-center items-center gap-6 text-xs sm:text-sm text-indigo-300/80">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Cập nhật liên tục</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Đăng ký trực tuyến nhanh chóng</span>
          </div>
        </div>
      </div>
    </section>
  );
}
