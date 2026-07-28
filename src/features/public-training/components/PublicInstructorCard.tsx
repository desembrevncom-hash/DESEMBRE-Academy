import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicInstructorInfo } from "../services/publicTrainingApi";
import { getInitials } from "../utils/formatters";
import { ArrowRight, GraduationCap, Award, Tag } from "lucide-react";

interface PublicInstructorCardProps {
  instructor: PublicInstructorInfo | null;
}

export function PublicInstructorCard({ instructor }: PublicInstructorCardProps) {
  if (!instructor) {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
          DA
        </div>
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Giảng viên phụ trách</div>
          <h4 className="text-lg font-bold text-slate-900">Đội ngũ đào tạo DESEMBRE Academy</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Các chuyên gia Da liễu, Thẩm mỹ và Senior Trainer hơn 10 năm kinh nghiệm trong ngành Spa / Thẩm mỹ chuẩn Y Khoa.
          </p>
        </div>
      </div>
    );
  }

  const instructorSlug = (instructor as any).slug;

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-center sm:items-start gap-5">
      {instructor.avatar_url ? (
        <img
          src={instructor.avatar_url}
          alt={instructor.full_name}
          className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 shrink-0 shadow-md"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
          {getInitials(instructor.full_name)}
        </div>
      )}

      <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center justify-center sm:justify-start gap-1">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Giảng viên phụ trách</span>
        </div>

        <h4 className="text-lg font-extrabold text-slate-900 leading-snug">
          {instructor.full_name}
        </h4>

        {instructor.title && (
          <p className="text-xs font-semibold text-slate-500">{instructor.title}</p>
        )}

        {instructor.expertise && instructor.expertise.length > 0 && (
          <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1">
            {instructor.expertise.slice(0, 3).map((exp, idx) => (
              <span
                key={idx}
                className="inline-flex items-center text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md"
              >
                {exp}
              </span>
            ))}
          </div>
        )}
      </div>

      {instructorSlug && (
        <div className="sm:self-center shrink-0">
          <Link
            to="/giang-vien/$slug"
            params={{ slug: instructorSlug }}
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors"
          >
            <span>Hồ sơ giảng viên</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
