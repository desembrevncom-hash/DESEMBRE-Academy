import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicCourseBatch } from "@/features/public-training/services/publicTrainingApi";
import { formatDateSafe, getFormatConfig } from "@/features/public-training/utils/formatters";

interface LandingAgendaSectionProps {
  batches: PublicCourseBatch[];
  onOpenRegister: (batch: PublicCourseBatch) => void;
  onOpenConsult: () => void;
}

export function LandingAgendaSection({ batches, onOpenRegister, onOpenConsult }: LandingAgendaSectionProps) {
  const hasPublicBatch = batches.length > 0;

  return (
    <section id="campaign-schedule-section" className="py-16 sm:py-20 bg-slate-50 font-sans text-slate-900 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Lịch Học & Đăng Ký</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Lớp Khai Giảng Đang Mở Đăng Ký
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Chọn lớp học phù hợp với thời gian làm việc của bạn để tham gia ngay.
          </p>
        </div>

        {hasPublicBatch ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            {batches.map((batch) => {
              const formatConfig = getFormatConfig(batch.training_format);
              return (
                <div
                  key={batch.id}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg hover:border-indigo-300 transition-all duration-300 space-y-6"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${formatConfig.cls}`}>
                          {formatConfig.label}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900">{batch.title}</h3>
                    </div>

                    <Button
                      onClick={() => onOpenRegister(batch)}
                      className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-indigo-600/20 gap-2 shrink-0"
                    >
                      <span>Đăng ký giữ chỗ</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Sessions Schedule */}
                  {batch.sessions && batch.sessions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Chi tiết lịch học ({batch.sessions.length} buổi)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {batch.sessions.map((s, idx) => (
                          <div
                            key={s.id || idx}
                            className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5 text-xs"
                          >
                            <span className="font-bold text-indigo-700 block">
                              Buổi {idx + 1}: {s.title || "Buổi học lý thuyết & thực hành"}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                              <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>
                                {formatDateSafe(s.starts_at, "dd/MM/yyyy • HH:mm")}
                                {s.ends_at ? ` - ${formatDateSafe(s.ends_at, "HH:mm")}` : ""}
                              </span>
                            </div>
                            {s.location_detail && (
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{s.location_detail}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Zero Public Batches State */
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Hiện chưa có lịch khai giảng phù hợp cho chiến dịch này.</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Đợt khai giảng tiếp theo đang được sắp xếp. Vui lòng để lại thông tin để bộ phận tư vấn DESEMBRE ưu tiên liên hệ gửi lịch mới nhất.
              </p>
            </div>
            <Button
              onClick={onOpenConsult}
              className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20"
            >
              Nhận thông báo lịch mới
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
