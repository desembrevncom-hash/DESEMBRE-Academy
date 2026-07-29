import { PublicSessionInfo } from "../services/publicTrainingApi";
import { formatDateSafe, formatTimeRange } from "../utils/formatters";
import { Calendar, Clock, MapPin, Video, MonitorPlay } from "lucide-react";

interface SessionTimelineProps {
  sessions: PublicSessionInfo[];
}

function getFormatIcon(type: string | null) {
  switch (type?.toLowerCase()) {
    case "zoom":
      return <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    case "office":
      return <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    case "hybrid":
      return <MonitorPlay className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
    default:
      return <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
  }
}

export function SessionTimeline({ sessions }: SessionTimelineProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center space-y-2">
        <Calendar className="w-8 h-8 text-slate-400 mx-auto stroke-1" />
        <p className="text-sm font-semibold text-slate-700">Lịch học đang cập nhật</p>
        <p className="text-xs text-slate-500">
          Danh sách chi tiết các buổi học cho lớp này đang được sắp xếp. Bạn vẫn có thể đăng ký để giữ chỗ sớm.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session, idx) => (
        <div
          key={session.id || idx}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:border-indigo-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 text-xs flex items-center justify-center font-extrabold shrink-0 border border-indigo-100">
              {idx + 1}
            </span>
            <div className="min-w-0">
              <h5 className="font-bold text-slate-900 text-sm truncate">
                {session.title || `Buổi ${idx + 1}`}
              </h5>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            {session.starts_at && (
              <div className="flex items-center gap-1.5 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="text-slate-800 font-semibold">
                  {formatDateSafe(session.starts_at, "dd/MM/yyyy")}{" "}
                  <span className="text-slate-500 font-normal">
                    ({formatTimeRange(session.starts_at, session.ends_at)})
                  </span>
                </span>
              </div>
            )}

            {session.location_detail && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                {getFormatIcon(session.location_type)}
                <span className="truncate max-w-[200px] text-slate-700 font-medium">
                  {session.location_detail}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
