import { Sparkles, GraduationCap, ArrowDown, MessageSquareCheck, Award, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SynergisticProtocolHeroProps {
  coverUrl?: string | null;
}

export function SynergisticProtocolHero({ coverUrl }: SynergisticProtocolHeroProps) {
  const scrollToSchedule = () => {
    const el = document.getElementById("synergistic-schedule-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleConsult = () => {
    window.open("https://zalo.me", "_blank");
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white py-10 sm:py-14 md:py-16 antialiased">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-500/15 blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-70" />
      </div>

      <div className="relative container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-md shadow-lg shadow-indigo-950/40">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
              <span>DESEMBRE ACADEMY • CHUYÊN ĐỀ CHUYÊN SÂU</span>
              <Sparkles className="h-3 w-3 text-amber-300" />
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
              SYNERGISTIC PROTOCOL
            </h1>

            <p className="text-indigo-200/80 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl">
              Chương trình đào tạo chuyên sâu giúp chuẩn hóa protocol, nâng cao tư duy chỉ định và ứng dụng thực tế trong điều trị da chuẩn Y Khoa.
            </p>

            {/* Feature Bullets */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-indigo-200/90 font-medium">
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Chuẩn Y Khoa Hàn Quốc</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tư duy chỉ định chuyên sâu</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Button
                onClick={scrollToSchedule}
                className="h-12 px-6 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Đăng ký lớp gần nhất</span>
                <ArrowDown className="w-4 h-4" />
              </Button>

              <Button
                onClick={handleConsult}
                variant="outline"
                className="h-12 px-6 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm transition-all"
              >
                <MessageSquareCheck className="mr-2 w-4 h-4 text-indigo-300" />
                <span>Tư vấn lộ trình</span>
              </Button>
            </div>
          </div>

          {/* Right Image Banner */}
          <div className="lg:col-span-5">
            {coverUrl ? (
              <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl aspect-video sm:aspect-4/3 bg-slate-900 group">
                <img
                  src={coverUrl}
                  alt="SYNERGISTIC PROTOCOL"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="relative rounded-3xl border border-indigo-400/30 bg-gradient-to-br from-indigo-900/60 to-slate-900 p-6 sm:p-8 shadow-2xl aspect-4/3 flex flex-col justify-between text-left">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">
                    DESEMBRE ACADEMY
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-white leading-snug">
                    SYNERGISTIC PROTOCOL
                  </div>
                  <p className="text-xs text-indigo-200/70 mt-1">
                    Chuẩn hóa phác đồ điều trị da liễu Hàn Quốc
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
