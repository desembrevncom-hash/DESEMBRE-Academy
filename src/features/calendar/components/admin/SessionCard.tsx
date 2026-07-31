import { format, parseISO } from "date-fns";
import { Users } from "lucide-react";
import { isOneSessionCourseType } from "@/features/admin/constants";

export function SessionCard({ session, onClick }: { session: any, onClick: () => void }) {
  const batch = session.course_batches || session.batch || {};
  const course = batch?.courses || batch?.course || session.course || {};
  const studentCount: number = Number(session.student_count ?? session.registration_count ?? 0);
  
  const status = (session.status || 'scheduled').toLowerCase();
  const catSlug = course.category_slug || course.category?.slug;
  const isOneSession = isOneSessionCourseType(catSlug);

  let borderColor = "border-l-indigo-500";
  let cardOpacity = "";
  if (status === 'ongoing') {
    borderColor = "border-l-emerald-500";
  } else if (status === 'completed') {
    borderColor = "border-l-slate-400";
    cardOpacity = "opacity-70";
  } else if (status === 'cancelled') {
    borderColor = "border-l-rose-400";
    cardOpacity = "opacity-50";
  }

  const sessionLabel = isOneSession
    ? "1 buổi / phễu"
    : session.session_number
    ? `Buổi ${session.session_number}`
    : "Lớp học";

  return (
    <div 
      onClick={onClick}
      className={`border-l-4 ${borderColor} ${cardOpacity} bg-white hover:bg-slate-50 transition-colors p-2 rounded-r-md border-y border-r cursor-pointer text-sm shadow-2xs flex flex-col gap-1 mb-2`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="font-bold text-xs text-slate-900 truncate" title={course?.title || batch?.title || session.title}>
          {course?.title || batch?.title || session.title || "—"}
        </div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
          {sessionLabel}
        </span>
      </div>

      {session.title && session.title !== course?.title && session.title !== batch?.title && (
        <div className="text-[11px] text-slate-600 font-medium truncate">
          {session.title}
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-slate-500 mt-0.5">
        <span className="font-semibold text-indigo-900">
          {session.starts_at ? format(parseISO(session.starts_at), "HH:mm") : "TBA"}
        </span>
        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
          {batch?.training_format || session.location_type || "Zoom"}
        </span>
      </div>
      {status !== 'cancelled' && (
        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5 font-medium">
          <Users className="h-2.5 w-2.5" />
          <span>
            {studentCount > 0 ? `${studentCount} học viên` : "Chưa có học viên"}
          </span>
        </div>
      )}
    </div>
  );
}
