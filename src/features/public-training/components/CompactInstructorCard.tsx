import { Link } from "@tanstack/react-router";
import { PublicInstructorInfo } from "../services/publicTrainingApi";
import { getInitials } from "../utils/formatters";
import { ExternalLink, User } from "lucide-react";

interface CompactInstructorCardProps {
  instructor: PublicInstructorInfo | null;
}

export function CompactInstructorCard({ instructor }: CompactInstructorCardProps) {
  if (!instructor) {
    return (
      <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
          DA
        </div>
        <div className="min-w-0 flex-1 text-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Giảng viên phụ trách
          </div>
          <div className="font-bold text-slate-900 text-sm truncate">
            Đội ngũ chuyên gia DESEMBRE Training Center
          </div>
          <div className="text-slate-500 truncate text-[11px]">
            Chuyên gia Da liễu & Thẩm mỹ cao cấp
          </div>
        </div>
      </div>
    );
  }

  const initials = getInitials(instructor.full_name);
  const profileSlug = (instructor as any).slug || instructor.id;

  return (
    <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-3 min-w-0">
        {instructor.avatar_url ? (
          <img
            src={instructor.avatar_url}
            alt={instructor.full_name}
            className="w-11 h-11 rounded-full object-cover border border-indigo-200 shrink-0 shadow-sm"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const next = e.currentTarget.nextElementSibling;
              if (next) next.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
            instructor.avatar_url ? "hidden" : ""
          }`}
        >
          {initials}
        </div>

        <div className="min-w-0 text-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-0.5">
            Chuyên gia đào tạo
          </div>
          <div className="font-bold text-slate-900 text-sm truncate">
            {instructor.full_name}
          </div>
          {instructor.title && (
            <div className="text-slate-500 truncate text-[11px] font-medium">
              {instructor.title}
            </div>
          )}

          {instructor.expertise && instructor.expertise.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {instructor.expertise.slice(0, 3).map((exp, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center text-[10px] bg-indigo-100/70 text-indigo-800 px-2 py-0.5 rounded-md font-semibold"
                >
                  {exp}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <Link
        to="/giang-vien/$slug"
        params={{ slug: profileSlug }}
        className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-xl transition-all shrink-0 self-start sm:self-center shadow-2xs"
      >
        <span>Hồ sơ giảng viên</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
