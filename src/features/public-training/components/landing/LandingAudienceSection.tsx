import { Users, CheckCircle } from "lucide-react";
import { LandingAudienceItem } from "@/features/admin/services/academyAdminLandingPagesApi";

interface LandingAudienceSectionProps {
  audience?: LandingAudienceItem[];
}

export function LandingAudienceSection({ audience }: LandingAudienceSectionProps) {
  if (!audience || audience.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-white font-sans text-slate-900 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            <span>Đối Tượng Phù Hợp</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ai Nên Tham Gia Chương Trình Này?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Chương trình được thiết kế chuyên biệt dành cho các chuyên gia, chủ cơ sở và kỹ thuật viên ngành làm đẹp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {audience.map((item, idx) => (
            <div
              key={idx}
              className="relative p-6 sm:p-7 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 hover:bg-white hover:shadow-xl transition-all duration-300 space-y-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-black text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                0{idx + 1}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-900 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                <CheckCircle className="w-4 h-4" />
                <span>Nâng tầm tay nghề ngay</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
