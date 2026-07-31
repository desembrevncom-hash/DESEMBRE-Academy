import { useState } from "react";
import { PublicCourseBatch } from "../services/publicTrainingApi";
import { formatDateSafe, formatTimeRange } from "../utils/formatters";
import { getTrainingFormatMeta } from "../utils/trainingFormat";
import { CompactInstructorCard } from "./CompactInstructorCard";
import { Calendar, MapPin, Users, Clock, ArrowRight, ChevronDown, ChevronUp, MessageSquare, Sparkles, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseISO, format } from "date-fns";

interface TrainingScheduleCardProps {
  batch: PublicCourseBatch;
  onRegister: (batch: PublicCourseBatch) => void;
}

export function TrainingScheduleCard({ batch, onRegister }: TrainingScheduleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const formatMeta = getTrainingFormatMeta(batch.training_format);
  const FormatIcon = formatMeta.icon;

  const totalRegistered = (batch.confirmed_count || 0) + (batch.pending_count || 0);

  const isFull =
    batch.max_participants != null &&
    batch.max_participants > 0 &&
    totalRegistered >= batch.max_participants;

  const remainingSeats =
    batch.max_participants != null
      ? Math.max(0, batch.max_participants - totalRegistered)
      : null;

  const sessions = batch.sessions || [];
  const instructor = batch.instructor;
  const rawCourseTitle = batch.course?.title || batch.title;
  const courseTitle = rawCourseTitle.replace(/^\s*Chuyên\s+đề\s*:\s*/i, "");
  const courseSummary = batch.course?.summary || batch.description;
  const coverUrl = batch.course?.cover_url || null;

  const closeTime = batch.registration_closes_at ? new Date(batch.registration_closes_at).getTime() : null;
  const now = Date.now();
  const isExpired = closeTime ? closeTime < now : false;
  const hoursUntilClose = closeTime ? (closeTime - now) / 3600000 : null;
  const isUrgentClose = !isExpired && hoursUntilClose !== null && hoursUntilClose > 0 && hoursUntilClose <= 48;

  // Extract date parts for poster date box & meta row
  let startDayStr = "01";
  let startMonthStr = "08";
  let startYearStr = "2026";
  let fullStartDateStr = "01/08/2026";

  if (batch.start_date) {
    try {
      const d = parseISO(batch.start_date);
      startDayStr = format(d, "dd");
      startMonthStr = format(d, "MM");
      startYearStr = format(d, "yyyy");
      fullStartDateStr = format(d, "dd/MM/yyyy");
    } catch (e) {}
  } else if (sessions.length > 0 && sessions[0].starts_at) {
    try {
      const d = parseISO(sessions[0].starts_at);
      startDayStr = format(d, "dd");
      startMonthStr = format(d, "MM");
      startYearStr = format(d, "yyyy");
      fullStartDateStr = format(d, "dd/MM/yyyy");
    } catch (e) {}
  }

  // Format time range for main session
  const mainSessionTime = sessions.length > 0 && sessions[0].starts_at
    ? formatTimeRange(sessions[0].starts_at, sessions[0].ends_at)
    : "14:00–16:00";

  const handleConsult = () => {
    window.open("https://zalo.me", "_blank");
  };

  return (
    <div className={`group bg-white border border-slate-200/90 ${formatMeta.cardBorderClass} rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 relative space-y-4 antialiased`}>
      {/* 1. Rich Cover Banner with Dark Gradient & Poster Date Box */}
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 shadow-md border border-white/10 min-h-[200px] sm:min-h-[230px] flex flex-col justify-between bg-slate-950">
        {/* Background Image (Cover URL) or Format Gradient Fallback */}
        {coverUrl && !imgError ? (
          <img
            src={coverUrl}
            alt={courseTitle}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover object-[center_right] group-hover:scale-105 transition-transform duration-700 pointer-events-none"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${formatMeta.bannerGradientClass} pointer-events-none`} />
        )}

        {/* Dual Gradient Overlays for High Contrast Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/75 to-slate-900/25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 to-transparent pointer-events-none" />

        {/* Banner Content Layer */}
        <div className="relative z-10 space-y-3">
          {/* Top Bar: Clean Date Box + Format & Status Badges */}
          <div className="flex items-start justify-between gap-3">
            {/* Poster Date Box */}
            <div className={`flex flex-col items-center justify-center px-3.5 py-2 rounded-2xl text-center shrink-0 min-w-[72px] ${formatMeta.dateBoxClass} shadow-xs`}>
              <span className="text-2xl sm:text-3xl font-black leading-none tracking-tight">{startDayStr}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider mt-0.5">THÁNG {startMonthStr}</span>
            </div>

            {/* Badges Stack */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${formatMeta.badgeClass}`}>
                <FormatIcon className="h-3.5 w-3.5 shrink-0" />
                <span>{formatMeta.label}</span>
              </span>

              {isExpired ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/90 text-white border border-rose-400/40 shadow-xs">
                  Đã hết hạn
                </span>
              ) : isFull ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/90 text-white border border-red-400/40 shadow-xs">
                  Đã đủ chỗ
                </span>
              ) : isUrgentClose ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white border border-amber-400/40 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Sắp hết hạn (&lt;48h)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/90 text-white border border-emerald-400/40 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Đang mở đăng ký
                </span>
              )}
            </div>
          </div>

          {/* Course Title & Short Summary */}
          <div className="space-y-1.5 pt-1">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
              <span className="text-indigo-300 font-semibold mr-1.5">Chuyên đề:</span>
              {courseTitle}
            </h3>

            {courseSummary && (
              <p className="text-xs sm:text-sm text-slate-200/90 line-clamp-2 leading-relaxed max-w-2xl drop-shadow-xs">
                {courseSummary}
              </p>
            )}
          </div>
        </div>

        {/* Banner Footer: Value Props */}
        <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-indigo-200/90 font-medium pt-3 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Chuẩn Y Khoa Hàn Quốc</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Hỗ trợ sản phẩm DESEMBRE</span>
          </div>
        </div>
      </div>

      {/* 2. Unified Scannable Meta Row (No Triplicated Date Lines) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Ngày học */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Ngày học</span>
              <span className="font-bold text-slate-900 truncate block">{fullStartDateStr}</span>
            </div>
          </div>

          {/* Giờ học */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Giờ học</span>
              <span className="font-bold text-slate-900 truncate block">{mainSessionTime}</span>
            </div>
          </div>

          {/* Hình thức */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <FormatIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Hình thức</span>
              <span className="font-bold text-slate-900 truncate block">{formatMeta.label}</span>
            </div>
          </div>

          {/* Hạn đăng ký & Chỗ còn */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isUrgentClose ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Chỗ trống</span>
              <span className="font-bold text-slate-900 truncate block">
                {remainingSeats !== null ? `Còn ${remainingSeats} chỗ` : "Liên hệ tư vấn"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content Split: Left (Instructor + Sessions) & Right (CTAs) */}
      <div className="flex flex-col lg:flex-row lg:items-stretch gap-4 pt-1">
        {/* Left Column */}
        <div className="flex-1 space-y-3">
          {/* Instructor Compact Card */}
          <CompactInstructorCard instructor={instructor} />

          {/* Sessions Accordion if Multiple Sessions */}
          {sessions.length > 1 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 px-3.5 py-2 rounded-xl transition-all"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isExpanded ? "Thu gọn lịch học" : `Xem lịch học chi tiết (${sessions.length} buổi)`}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isExpanded && (
                <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                  {sessions.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 gap-2"
                    >
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span>{s.title || `Buổi ${idx + 1}`}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-slate-600 text-[11px]">
                        {s.starts_at && (
                          <div className="flex items-center gap-1 font-medium text-slate-700">
                            <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>
                              {formatDateSafe(s.starts_at, "dd/MM")}{" "}
                              ({formatTimeRange(s.starts_at, s.ends_at)})
                            </span>
                          </div>
                        )}

                        {s.location_detail && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{s.location_detail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Deadline & Action Buttons (Clean & Streamlined CTAs) */}
        <div className="lg:w-64 flex flex-col justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          {batch.registration_closes_at && (
            <div className={`text-xs text-center p-3 rounded-2xl border ${
              isExpired
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : isUrgentClose
                ? "bg-amber-50 border-amber-200 text-amber-900 font-bold"
                : "bg-slate-50 border-slate-100 text-slate-700"
            }`}>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">
                Hạn chót đăng ký
              </span>
              <span className="font-bold text-xs">
                {formatDateSafe(batch.registration_closes_at, "dd/MM/yyyy HH:mm")}
              </span>
            </div>
          )}

          <div className="space-y-2 mt-auto">
            {isExpired ? (
              <Button
                disabled
                className="w-full h-13 rounded-2xl text-xs font-semibold bg-slate-200 text-slate-500 cursor-not-allowed"
              >
                Đã hết hạn đăng ký
              </Button>
            ) : isFull ? (
              <Button
                disabled
                className="w-full h-13 rounded-2xl text-xs font-semibold bg-slate-200 text-slate-500 cursor-not-allowed"
              >
                Đã đủ chỗ — Chờ lớp mới
              </Button>
            ) : (
              <Button
                onClick={() => onRegister(batch)}
                className="w-full h-13 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/25 transition-all duration-200 gap-2"
              >
                <span>Đăng ký học ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            {!isExpired && (
              <Button
                onClick={handleConsult}
                variant="outline"
                className="w-full h-10 rounded-xl text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tư vấn qua Zalo</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
