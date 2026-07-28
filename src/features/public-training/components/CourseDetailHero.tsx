import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Sparkles, Calendar, ArrowDown, ChevronRight, BookOpen, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CourseDetailHeroProps {
  title: string;
  summary: string | null;
  coverUrl: string | null;
  batchCount: number;
}

export function CourseDetailHero({ title, summary, coverUrl, batchCount }: CourseDetailHeroProps) {
  const scrollToBatches = () => {
    const el = document.getElementById("batches-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white py-12 sm:py-16 md:py-20">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-500/15 blur-[130px]" />
      </div>

      <div className="relative container mx-auto px-4 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-indigo-300/80 mb-6 flex-wrap font-medium">
          <Link to="/" className="hover:text-white transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 text-indigo-400/60" />
          <Link to="/lich-khai-giang" className="hover:text-white transition-colors">Lịch đào tạo</Link>
          <ChevronRight className="w-3.5 h-3.5 text-indigo-400/60" />
          <span className="text-white font-semibold truncate max-w-xs">{title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Content Left */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-md">
              <GraduationCap className="h-4 w-4 text-indigo-400" />
              <span>DESEMBRE ACADEMY</span>
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
              {title}
            </h1>

            {summary && (
              <p className="text-indigo-200/80 text-sm sm:text-base leading-relaxed">
                {summary}
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                onClick={scrollToBatches}
                className="h-12 px-6 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 transition-all"
              >
                <Calendar className="mr-2 w-4 h-4" />
                <span>Xem lịch khai giảng ({batchCount} lớp)</span>
              </Button>

              <Button
                onClick={scrollToBatches}
                variant="outline"
                className="h-12 px-6 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm transition-all"
              >
                <span>Tư vấn lộ trình</span>
              </Button>
            </div>
          </div>

          {/* Cover Right */}
          <div className="lg:col-span-5">
            {coverUrl ? (
              <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl aspect-video sm:aspect-4/3 bg-slate-900 group">
                <img
                  src={coverUrl}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="relative rounded-3xl border border-indigo-400/30 bg-gradient-to-br from-indigo-900/60 to-slate-900 p-8 shadow-2xl aspect-4/3 flex flex-col justify-between text-left">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-1">Khoá đào tạo chuẩn Y Khoa</div>
                  <div className="text-lg font-bold text-white leading-snug">{title}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
