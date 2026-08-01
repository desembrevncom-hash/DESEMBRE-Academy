import { GraduationCap, Award, Sparkles } from "lucide-react";
import { PublicInstructorInfo } from "@/features/public-training/services/publicTrainingApi";

interface LandingInstructorSectionProps {
  instructor?: PublicInstructorInfo | null;
}

export function LandingInstructorSection({ instructor }: LandingInstructorSectionProps) {
  const name = instructor?.full_name || "Chuyên gia Đào tạo DESEMBRE Training Center";
  const title = instructor?.title || "Bác sĩ / Chuyên gia Thẩm mỹ Da liễu Chuyên sâu";

  return (
    <section className="py-16 sm:py-20 bg-white font-sans text-slate-900 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Giảng Viên Chuyên Chế</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Đồng Hành Cùng Chuyên Gia Đội Ngũ
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Giảng viên trình độ cao với nhiều năm kinh nghiệm đào tạo lâm sàng cho các chủ spa & bác sĩ da liễu.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 shadow-sm">
          <div className="relative shrink-0">
            {instructor?.avatar_url ? (
              <img
                src={instructor.avatar_url}
                alt={name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-indigo-600 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-indigo-700 to-slate-900 flex items-center justify-center text-white font-extrabold text-2xl border-2 border-indigo-500 shadow-md">
                DA
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-lg shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2.5 text-center sm:text-left">
            <div>
              <span className="text-indigo-600 font-bold text-xs uppercase tracking-wider block">Giảng viên chính</span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">{name}</h3>
              <p className="text-slate-600 text-xs sm:text-sm font-medium mt-0.5">{title}</p>
            </div>

            {instructor?.expertise && instructor.expertise.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1 justify-center sm:justify-start">
                {instructor.expertise.map((exp, i) => (
                  <span key={i} className="bg-white border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                    {exp}
                  </span>
                ))}
              </div>
            ) : (
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500 font-medium">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Trực tiếp giảng dạy lý thuyết & giám sát thực hành protocol</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
