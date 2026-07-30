import { useState } from "react";
import { PublicCourseBatch } from "../services/publicTrainingApi";
import { getFormatConfig, formatDateSafe, formatTimeRange } from "../utils/formatters";
import { CourseCardBanner } from "./CourseCardBanner";
import { CompactInstructorCard } from "./CompactInstructorCard";
import { Calendar, MapPin, Users, Clock, ArrowRight, ChevronDown, ChevronUp, MessageSquare, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrainingScheduleCardProps {
  batch: PublicCourseBatch;
  onRegister: (batch: PublicCourseBatch) => void;
}

export function TrainingScheduleCard({ batch, onRegister }: TrainingScheduleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatConfig = getFormatConfig(batch.training_format);
  const FormatIcon = formatConfig.icon;

  const totalRegistered = (batch.confirmed_count || 0) + (batch.pending_count || 0);

  const isFull =
    batch.max_participants != null &&
    batch.max_participants > 0 &&
    totalRegistered >= batch.max_participants;

  const remainingSeats =
    batch.max_participants != null
      ? Math.max(0, batch.max_participants - totalRegistered)
      : null;

  const isClosingSoon =
    !isFull &&
    remainingSeats != null &&
    remainingSeats <= 3 &&
    remainingSeats > 0;

  const sessions = batch.sessions || [];
  const instructor = batch.instructor;
  const courseTitle = batch.course?.title || batch.title;
  const courseSummary = batch.course?.summary || batch.description;
  const coverUrl = batch.course?.cover_url || null;

  const isExpired = batch.registration_closes_at
    ? new Date(batch.registration_closes_at).getTime() < Date.now()
    : false;

  const handleConsult = () => {
    window.open("https://zalo.me", "_blank");
  };

  return (
    <div className="group bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 relative space-y-5 antialiased">
      {/* 1. Course Banner */}
      <CourseCardBanner
        title={courseTitle}
        summary={courseSummary}
        coverUrl={coverUrl}
      />

      {/* 2. Main Content Split: Left (Batch Details + Instructor + Sessions) & Right (CTA Column) */}
      <div className="flex flex-col lg:flex-row lg:items-stretch gap-6 pt-1">
        {/* Left Column */}
        <div className="flex-1 space-y-4">
          {/* Batch Info Header */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
              {/* Batch Tag / Title */}
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">
                  Lớp: {batch.title}
                </span>
              </div>

              {/* Status & Format Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${formatConfig.cls}`}>
                  <FormatIcon className="h-3 w-3" />
                  <span>{formatConfig.label}</span>
                </span>

                {isExpired ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                    Đã hết hạn đăng ký
                  </span>
                ) : isFull ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                    Đã đủ chỗ
                  </span>
                ) : isClosingSoon ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    Sắp đóng đăng ký
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đang mở đăng ký
                  </span>
                )}
              </div>
            </div>

            {/* Batch Key Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Khai giảng:{" "}
                  <strong className="text-slate-900 font-bold">
                    {formatDateSafe(batch.start_date, "dd/MM/yyyy")}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Sĩ số:{" "}
                  <strong className="text-slate-900 font-bold">
                    {remainingSeats !== null ? `Còn ${remainingSeats} chỗ` : "Liên hệ để tư vấn sĩ số"}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Instructor Compact */}
          <CompactInstructorCard instructor={instructor} />

          {/* Sessions Accordion */}
          <div>
            {sessions.length > 0 ? (
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
                  <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                    {sessions.map((s, idx) => (
                      <div
                        key={s.id || idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 gap-2 shadow-2xs"
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
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50/90 border border-amber-200/80 px-3 py-1.5 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Lịch học đang cập nhật</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deadline & Action Buttons */}
        <div className="lg:w-60 flex flex-col justify-between gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          {batch.registration_closes_at && (
            <div className={`text-xs text-center p-3 rounded-2xl border ${
              isExpired ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100"
            }`}>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">
                Hạn chót đăng ký
              </span>
              <span className={`font-bold text-xs ${isExpired ? "text-rose-700" : "text-slate-900"}`}>
                {formatDateSafe(batch.registration_closes_at, "dd/MM/yyyy HH:mm")}
              </span>
            </div>
          )}

          <div className="space-y-2 mt-auto">
            {isExpired ? (
              <Button
                disabled
                className="w-full h-12 rounded-xl text-xs font-semibold bg-slate-200 text-slate-500 cursor-not-allowed"
              >
                Đã hết hạn đăng ký
              </Button>
            ) : isFull ? (
              <Button
                disabled
                className="w-full h-12 rounded-xl text-xs font-semibold bg-slate-200 text-slate-500 cursor-not-allowed"
              >
                Đã đủ chỗ — Chờ lớp mới
              </Button>
            ) : (
              <Button
                onClick={() => onRegister(batch)}
                className="w-full h-12 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 gap-1.5"
              >
                <span>Đăng ký học</span>
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
                <span>Tư vấn lộ trình</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
