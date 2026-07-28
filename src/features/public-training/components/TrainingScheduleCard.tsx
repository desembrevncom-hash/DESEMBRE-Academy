import { useState } from "react";
import { PublicCourseBatch } from "../services/publicTrainingApi";
import { getFormatConfig, formatDateSafe, formatTimeRange, getInitials } from "../utils/formatters";
import { Calendar, MapPin, Users, Clock, ArrowRight, ChevronDown, ChevronUp, UserCheck, ShieldCheck, Tag } from "lucide-react";
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

  return (
    <div className="group bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden">
      {/* Top Bar: Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Format Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${formatConfig.cls}`}>
            <FormatIcon className="h-3.5 w-3.5" />
            <span>{formatConfig.label}</span>
          </span>

          {/* Registration Status Badge */}
          {isFull ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
              Đã đủ chỗ
            </span>
          ) : isClosingSoon ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Sắp đóng đăng ký
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Đang mở đăng ký
            </span>
          )}

          {/* Seat info */}
          {remainingSeats !== null ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              Còn {remainingSeats} chỗ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
              Liên hệ để tư vấn sĩ số
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Main Content Info */}
        <div className="flex-1 space-y-4">
          {/* Title & Description */}
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
              {batch.course?.title || batch.title}
            </h3>

            {batch.course?.title && (
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                Lớp đào tạo: <span className="text-slate-800">{batch.title}</span>
              </p>
            )}

            {courseSummary && (
              <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                {courseSummary}
              </p>
            )}
          </div>

          {/* Instructor Profile Block / Fallback */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 flex items-center gap-3.5 max-w-lg">
            {instructor ? (
              <>
                {instructor.avatar_url ? (
                  <img
                    src={instructor.avatar_url}
                    alt={instructor.full_name}
                    className="w-12 h-12 rounded-full object-cover border border-indigo-200 shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                    {getInitials(instructor.full_name)}
                  </div>
                )}
                <div className="min-w-0 flex-1 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-0.5">
                    Giảng viên phụ trách
                  </div>
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {instructor.full_name}
                  </div>
                  {instructor.title && (
                    <div className="text-slate-500 truncate">{instructor.title}</div>
                  )}
                  {instructor.expertise && instructor.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {instructor.expertise.slice(0, 3).map((exp, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  DA
                </div>
                <div className="text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                    Giảng viên
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    Đội ngũ đào tạo DESEMBRE Academy
                  </div>
                  <div className="text-slate-500">Chuyên gia Da liễu & Thẩm mỹ cao cấp</div>
                </div>
              </>
            )}
          </div>

          {/* Session Schedule List */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lịch học chi tiết ({sessions.length} buổi)
              </h4>

              {sessions.length > 2 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <span>{isExpanded ? "Thu gọn" : "Xem tất cả"}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {sessions.length > 0 ? (
              <div className="space-y-2">
                {(isExpanded ? sessions : sessions.slice(0, 2)).map((s, idx) => (
                  <div
                    key={s.id || idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm bg-white p-3 rounded-xl border border-slate-100 gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 font-semibold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] flex items-center justify-center font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span>{s.title || `Buổi ${idx + 1}`}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-slate-600 text-xs">
                      {s.starts_at && (
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>
                            {formatDateSafe(s.starts_at, "dd/MM")}{" "}
                            ({formatTimeRange(s.starts_at, s.ends_at)})
                          </span>
                        </div>
                      )}

                      {s.location_detail && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{s.location_detail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Lịch học chi tiết sẽ được ban tổ chức chốt khi đủ lớp.
              </p>
            )}
          </div>
        </div>

        {/* Right Panel Actions & Deadline */}
        <div className="lg:w-64 flex flex-col justify-between gap-3.5 shrink-0 pt-5 lg:pt-0 border-t lg:border-t-0 border-slate-100/80">
          {batch.registration_closes_at && (
            <div className="text-xs text-center bg-rose-50 border border-rose-100 p-3 rounded-2xl">
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">
                Hạn chót đăng ký
              </span>
              <span className="font-bold text-rose-700 text-sm">
                {formatDateSafe(batch.registration_closes_at, "dd/MM/yyyy HH:mm")}
              </span>
            </div>
          )}

          {isFull ? (
            <Button
              disabled
              className="w-full h-14 rounded-2xl text-sm font-semibold bg-slate-200 text-slate-500 cursor-not-allowed"
            >
              Đã đủ chỗ — Liên hệ chờ lớp mới
            </Button>
          ) : (
            <Button
              onClick={() => onRegister(batch)}
              className="w-full h-14 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/25 transition-all duration-200 gap-2"
            >
              <span>Đăng ký tham gia</span>
              <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          )}

          {sessions.length > 2 && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-center text-indigo-600 hover:underline font-medium pt-1"
            >
              Xem chi tiết lịch học ({sessions.length} buổi)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
