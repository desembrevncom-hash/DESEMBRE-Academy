import { Calendar, Sparkles, ArrowRight, Bell, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicCourseBatch } from "@/features/public-training/services/publicTrainingApi";

interface LandingHeroProps {
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  coverUrl?: string | null;
  primaryCtaLabel?: string | null;
  secondaryCtaLabel?: string | null;
  hasPublicBatch: boolean;
  openBatch?: PublicCourseBatch | null;
  onOpenRegister: () => void;
  onScrollToSchedule: () => void;
  onOpenConsult: () => void;
}

export function LandingHero({
  title,
  subtitle,
  badge,
  coverUrl,
  primaryCtaLabel,
  secondaryCtaLabel,
  hasPublicBatch,
  openBatch,
  onOpenRegister,
  onScrollToSchedule,
  onOpenConsult,
}: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white pt-12 pb-16 sm:pt-16 sm:pb-24">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-purple-600/15 blur-[90px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Content Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>{badge || "Chương trình Đào tạo Chuyên sâu DESEMBRE Academy"}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15]">
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {subtitle}
              </p>
            )}

            {/* Open Batch Status Info Pill */}
            {hasPublicBatch && openBatch ? (
              <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm text-xs">
                <span className="flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Đang mở đăng ký
                </span>
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Lớp: <span className="text-white font-bold">{openBatch.title}</span>
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold px-4 py-2 rounded-2xl backdrop-blur-sm">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Hiện chưa có lịch công bố public. Bạn có thể đăng ký nhận thông báo đợt khai giảng mới nhất.</span>
              </div>
            )}

            {/* Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Button
                onClick={hasPublicBatch ? onOpenRegister : onOpenConsult}
                className="h-14 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-600/30 transition-all duration-200 gap-2 hover:scale-[1.02]"
              >
                <span>{hasPublicBatch ? (primaryCtaLabel || "Đăng ký giữ chỗ ngay") : "Nhận thông báo lịch mới"}</span>
                <ArrowRight className="w-5 h-5" />
              </Button>

              {hasPublicBatch && (
                <Button
                  onClick={onScrollToSchedule}
                  variant="outline"
                  className="h-14 px-7 bg-white/10 hover:bg-white/15 text-white border-white/20 hover:border-white/40 font-bold text-sm rounded-2xl backdrop-blur-sm transition-all"
                >
                  <span>{secondaryCtaLabel || "Xem lịch học chi tiết"}</span>
                </Button>
              )}
            </div>

            {/* Trust Badges Bar */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Chứng nhận từ DESEMBRE Training Center
              </span>
              <span className="hidden sm:inline text-slate-700">•</span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Chuẩn Y Khoa Hàn Quốc
              </span>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden border border-white/15 bg-slate-900/80 shadow-2xl shadow-indigo-950/50 group">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={title}
                  className="w-full h-[320px] sm:h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-[320px] sm:h-[400px] bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 flex items-center justify-center p-8 text-center">
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto text-indigo-300 font-bold text-2xl">
                      DA
                    </div>
                    <span className="text-sm font-extrabold uppercase tracking-widest text-indigo-300 block">
                      DESEMBRE ACADEMY
                    </span>
                    <h3 className="text-xl font-bold text-white leading-tight">{title}</h3>
                  </div>
                </div>
              )}

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-80" />

              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-xs">
                <span className="text-indigo-400 font-bold block text-[10px] uppercase tracking-wider">
                  Tài liệu & Chứng nhận
                </span>
                <span className="text-white font-semibold block mt-0.5">
                  Nhận trọn bộ Slide bài giảng & Hướng dẫn protocol thực chiến
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
