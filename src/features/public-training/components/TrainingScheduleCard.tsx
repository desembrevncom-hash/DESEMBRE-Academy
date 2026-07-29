import { useState } from "react";
import { PublicCourseBatch } from "../services/publicTrainingApi";
import { getFormatConfig, formatDateSafe, formatTimeRange, getInitials } from "../utils/formatters";
import { Calendar, MapPin, Users, Clock, ArrowRight, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
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
  const courseSummary = batch.course?.summary || batch.description;

  const isExpired = batch.registration_closes_at
    ? new Date(batch.registration_closes_at).getTime() < Date.now()
    : false;

  const handleConsult = () => {
    window.open("https://zalo.me", "_blank");
  };

  return (
    <div className="group bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden">
      {/* Top Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Format Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${formatConfig.cls}`}>
            <FormatIcon className="h-3.5 w-3.5" />
            <span>{formatConfig.label}</span>
          </span>

          {/* Registration Status Badge */}
          {isExpired ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
              Đã hết hạn đăng ký
            </span>
          ) : isFull ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
              Đã đủ chỗ
            </span>
          ) : isClosingSoon ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Sắp đóng đăng ký
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Đang mở đăng ký
            </span>
          )}

          {/* Seat info */}
          {remainingSeats !== null ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              Còn {remainingSeats} chỗ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
              Chỉ tiêu giới hạn
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-stretch gap-6">
        {/* Left Section: Information */}
        <div className="flex-1 space-y-3.5">
          <div>
            {/* Batch subtitle */}
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>{batch.title}</span>
              {batch.start_date && (
                <span className="text-slate-400 font-normal">
                  • Khai giảng {formatDateSafe(batch.start_date, "dd/MM/yyyy")}
                </span>
              )}
            </div>

            {/* Course title */}
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
              {batch.course?.title || batch.title}
            </h3>

            {courseSummary && (
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                {courseSummary}
              </p>
            )}
          </div>

          {/* Compact Instructor Chip */}
          <div className="inline-flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-2.5 pr-4 max-w-full">
            {instructor ? (
              <>
                {instructor.avatar_url ? (
                  <img
                    src={instructor.avatar_url}
                    alt={instructor.full_name}
                    className="w-9 h-9 rounded-full object-cover border border-indigo-200 shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {getInitials(instructor.full_name)}
                  </div>
                )}
                <div className="min-w-0 text-xs">
                  <div className="font-bold text-slate-900 truncate leading-tight">
                    {instructor.full_name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {instructor.title || "Chuyên gia đào tạo DESEMBRE"}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  DA
                </div>
                <div className="min-w-0 text-xs">
                  <div className="font-bold text-slate-900 truncate leading-tight">
                    Đội ngũ đào tạo DESEMBRE Academy
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Chuyên gia Da liễu & Thẩm mỹ
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Schedule Section */}
          <div className="pt-1">
            {sessions.length > 0 ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 px-3 py-1.5 rounded-xl transition-all"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isExpanded ? "Thu gọn lịch học" : `Xem lịch chi tiết (${sessions.length} buổi)`}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="space-y-2 pt-2 animate-in fade-in duration-200">
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
            ) : (
              <p className="text-xs text-slate-400 italic">
                Lịch học đang cập nhật
              </p>
            )}
          </div>
        </div>

        {/* Right Section: Actions & Deadline */}
        <div className="lg:w-56 flex flex-col justify-between gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100/80">
          {batch.registration_closes_at && (
            <div className={`text-xs text-center p-2.5 rounded-2xl border ${
              isExpired ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100"
            }`}>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">
                Hạn chót đăng ký
              </span>
              <span className={`font-bold text-xs ${isExpired ? "text-rose-700" : "text-slate-800"}`}>
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
                className="w-full h-12 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 gap-1.5"
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
