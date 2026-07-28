import { PublicCourseBatch } from "../services/publicTrainingApi";
import { format, parseISO } from "date-fns";
import { Calendar, MapPin, Users, Clock, Video, MonitorPlay, ArrowRight, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

function FormatBadge({ type }: { type: string | null }) {
  const configs: Record<string, { label: string; icon: any; cls: string }> = {
    zoom: { label: "Zoom Online", icon: Video, cls: "bg-blue-50 text-blue-700 border-blue-200" },
    office: { label: "Văn phòng (Offline)", icon: MapPin, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    hybrid: { label: "Hybrid", icon: MonitorPlay, cls: "bg-purple-50 text-purple-700 border-purple-200" },
    external_seminar: { label: "Seminar ngoài", icon: Calendar, cls: "bg-amber-50 text-amber-700 border-amber-200" },
  };

  const key = type || "office";
  const cfg = configs[key] || { label: key, icon: Calendar, cls: "bg-slate-100 text-slate-700 border-slate-200" };
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{cfg.label}</span>
    </span>
  );
}

interface TrainingScheduleCardProps {
  batch: PublicCourseBatch;
  onRegister: (batch: PublicCourseBatch) => void;
}

export function TrainingScheduleCard({ batch, onRegister }: TrainingScheduleCardProps) {
  const isFull =
    batch.max_participants != null &&
    batch.max_participants > 0 &&
    batch.confirmed_count >= batch.max_participants;

  const remaining =
    batch.max_participants != null
      ? Math.max(0, batch.max_participants - batch.confirmed_count)
      : null;

  const sessions = batch.sessions || [];
  const instructor = batch.instructor;

  return (
    <div className="group bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Top badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <FormatBadge type={batch.training_format} />

            {isFull ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                Đã đủ chỗ
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Đang mở đăng ký
              </span>
            )}

            {remaining !== null && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                Còn {remaining} chỗ
              </span>
            )}
          </div>

          {/* Titles */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
              {batch.course?.title || batch.title}
            </h3>
            {batch.course?.title && (
              <p className="text-sm font-medium text-slate-500 mt-1">
                Lớp đào tạo: <span className="text-slate-700">{batch.title}</span>
              </p>
            )}
          </div>

          {/* Instructor Info if available */}
          {instructor && (
            <div className="flex items-center gap-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 max-w-md">
              {instructor.avatar_url ? (
                <img
                  src={instructor.avatar_url}
                  alt={instructor.full_name}
                  className="w-11 h-11 rounded-full object-cover border border-indigo-200"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {instructor.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-xs">
                <div className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Giảng viên phụ trách</div>
                <div className="font-bold text-slate-900 text-sm">{instructor.full_name}</div>
                {instructor.title && <div className="text-indigo-600 font-medium">{instructor.title}</div>}
              </div>
            </div>
          )}

          {/* Detailed Schedule List */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Lịch học chi tiết ({sessions.length} buổi)
            </h4>

            {sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm bg-white p-2.5 rounded-xl border border-slate-100 gap-2"
                  >
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] flex items-center justify-center font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span>{s.title || `Buổi ${idx + 1}`}</span>
                    </div>

                    <div className="flex items-center gap-4 text-slate-600">
                      {s.starts_at && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {format(parseISO(s.starts_at), "dd/MM/yyyy HH:mm")}
                            {s.ends_at ? ` - ${format(parseISO(s.ends_at), "HH:mm")}` : ""}
                          </span>
                        </div>
                      )}
                      {s.location_detail && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[150px]">{s.location_detail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Lịch học chi tiết sẽ được thông báo khi chốt danh sách.</p>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="lg:w-64 flex flex-col justify-end gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          {batch.registration_closes_at && (
            <div className="text-xs text-center text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              Hạn chót đăng ký:{" "}
              <span className="font-semibold text-rose-600 block sm:inline">
                {format(parseISO(batch.registration_closes_at), "dd/MM/yyyy HH:mm")}
              </span>
            </div>
          )}

          {isFull ? (
            <Button
              disabled
              className="w-full h-12 rounded-xl text-sm font-medium bg-slate-200 text-slate-500 cursor-not-allowed"
            >
              Đã đủ học viên
            </Button>
          ) : (
            <Button
              onClick={() => onRegister(batch)}
              className="w-full h-12 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all duration-200"
            >
              <span>Đăng ký tham gia</span>
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
