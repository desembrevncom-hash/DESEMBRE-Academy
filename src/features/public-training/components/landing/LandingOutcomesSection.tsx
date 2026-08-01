import { Award, Check } from "lucide-react";
import { LandingOutcomeItem } from "@/features/admin/services/academyAdminLandingPagesApi";

interface LandingOutcomesSectionProps {
  outcomes?: LandingOutcomeItem[];
}

export function LandingOutcomesSection({ outcomes }: LandingOutcomesSectionProps) {
  if (!outcomes || outcomes.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-slate-900 text-white font-sans border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>Giá Trị Khóa Học</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Bạn Sẽ Nhận Được Gì Sau Chương Trình?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Kiến thức chuẩn Y Khoa kết hợp kỹ năng thực chiến áp dụng trực tiếp cho spa/clinic của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {outcomes.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800 transition-all duration-300 space-y-3"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
