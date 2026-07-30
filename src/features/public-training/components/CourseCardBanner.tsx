import { Sparkles, CheckCircle2, BookOpen, Award } from "lucide-react";

interface CourseCardBannerProps {
  title: string;
  summary: string | null;
  coverUrl: string | null;
}

export function CourseCardBanner({ title, summary, coverUrl }: CourseCardBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-5 sm:p-6 shadow-md border border-indigo-500/20">
      {/* Background glow overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-blue-500/15 blur-3xl" />
      </div>

      <div className="relative grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        {/* Left Info Column */}
        <div className="sm:col-span-8 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Khóa đào tạo chuyên sâu</span>
          </div>

          <h3 className="text-lg sm:text-2xl font-extrabold text-white leading-tight tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
            {title}
          </h3>

          {summary && (
            <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed line-clamp-2">
              {summary}
            </p>
          )}

          {/* Value props bullets */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] sm:text-xs text-indigo-200/90 font-medium">
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Chuẩn Y Khoa Hàn Quốc</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Thực hành 80% thời lượng</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Hỗ trợ sản phẩm DESEMBRE</span>
            </div>
          </div>
        </div>

        {/* Right Cover Column */}
        <div className="sm:col-span-4 hidden sm:block">
          {coverUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video shadow-lg bg-slate-950 group">
              <img
                src={coverUrl}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="relative rounded-xl border border-indigo-400/20 bg-indigo-900/40 p-4 aspect-video flex flex-col justify-between text-left">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                DESEMBRE Training
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
