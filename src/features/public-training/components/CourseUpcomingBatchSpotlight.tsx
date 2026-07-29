import { PublicCourseBatch } from "../services/publicTrainingApi";
import { getFormatConfig, formatDateSafe } from "../utils/formatters";
import { CompactInstructorCard } from "./CompactInstructorCard";
import { Calendar, Users, ArrowRight, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CourseUpcomingBatchSpotlightProps {
  batch: PublicCourseBatch | null;
  onRegister: (batch: PublicCourseBatch) => void;
  onViewScheduleDetails: () => void;
}

export function CourseUpcomingBatchSpotlight({
  batch,
  onRegister,
  onViewScheduleDetails,
}: CourseUpcomingBatchSpotlightProps) {
  if (!batch) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-4">
        <Calendar className="h-10 w-10 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">
          Chưa có lịch khai giảng công khai
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Hiện tại chưa có lớp mới mở đăng ký cho khóa học này. Bạn vẫn có thể gửi thông tin để tư vấn viên xếp lớp sớm nhất.
        </p>
      </div>
    );
  }

  const formatConfig = getFormatConfig(batch.training_format);
  const FormatIcon = formatConfig.icon;

  const totalRegistered = (batch.confirmed_count || 0) + (batch.pending_count || 0);
  const isOpen = (batch.registration_status || "").toLowerCase() === "open";
  const isFull =
    batch.max_participants != null &&
    batch.max_participants > 0 &&
    totalRegistered >= batch.max_participants;

  const remainingSeats =
    batch.max_participants != null
      ? Math.max(0, batch.max_participants - totalRegistered)
      : null;

  return (
    <div id="spotlight-batch-card" className="bg-gradient-to-b from-white to-slate-50/80 border-2 border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-500/5 space-y-6 relative overflow-hidden">
      {/* Decorative accent banner */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-400" />

      {/* Top Tag & Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Lớp khai giảng gần nhất</span>
          </span>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${formatConfig.cls}`}>
            <FormatIcon className="h-3.5 w-3.5" />
            <span>{formatConfig.label}</span>
          </span>
        </div>

        <div>
          {isFull ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
              Đã đủ chỗ
            </span>
          ) : isOpen ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Đang mở đăng ký
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Dự kiến sắp mở
            </span>
          )}
        </div>
      </div>

      {/* Title & Timing Info */}
      <div className="space-y-3">
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {batch.title}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-600">
          <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                Ngày khai giảng
              </span>
              <span className="font-bold text-slate-900">
                {batch.start_date
                  ? formatDateSafe(batch.start_date, "dd/MM/yyyy")
                  : "Liên hệ xem lịch mới nhất"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            <Clock className="w-4 h-4 text-rose-500 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                Hạn chót giữ chỗ
              </span>
              <span className="font-bold text-slate-900">
                {batch.registration_closes_at
                  ? formatDateSafe(batch.registration_closes_at, "dd/MM/yyyy HH:mm")
                  : "Đang nhận hồ sơ tuyển sinh"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Instructor Profile */}
      <CompactInstructorCard instructor={batch.instructor} />

      {/* Primary & Secondary Action CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {isOpen && !isFull ? (
          <Button
            onClick={() => onRegister(batch)}
            className="w-full sm:flex-1 h-13 rounded-2xl text-sm sm:text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition-all gap-2"
          >
            <span>Đăng ký tham gia ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={() => onRegister(batch)}
            className="w-full sm:flex-1 h-13 rounded-2xl text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all gap-2"
          >
            <span>Liên hệ tư vấn giữ chỗ</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}

        <Button
          onClick={onViewScheduleDetails}
          variant="outline"
          className="w-full sm:w-auto h-13 px-6 rounded-2xl text-sm font-bold border-slate-200 hover:bg-slate-100 text-slate-700 transition-all"
        >
          <span>Xem lịch chi tiết</span>
        </Button>
      </div>
    </div>
  );
}
