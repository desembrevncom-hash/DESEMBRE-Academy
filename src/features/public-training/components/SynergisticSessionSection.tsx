import { PublicSessionInfo } from "../services/publicTrainingApi";
import { formatDateSafe, formatTimeRange } from "../utils/formatters";
import { Calendar, Clock, MapPin, BookOpen, CheckCircle2 } from "lucide-react";

interface SynergisticSessionSectionProps {
  sessions: PublicSessionInfo[];
}

export function SynergisticSessionSection({ sessions }: SynergisticSessionSectionProps) {
  const fallbackCurriculum = [
    {
      session: "Buổi 1",
      title: "Nền tảng SYNERGISTIC PROTOCOL",
      description: "Tổng quan về nguyên lý phối hợp hoạt chất và cơ chế tác động đa tầng trên hàng rào da.",
    },
    {
      session: "Buổi 2",
      title: "Phân tích tình trạng da & Chỉ định",
      description: "Nhận diện tổn thương lâm sàng: mụn, thâm sắc tố, lão hóa và lựa chọn nhóm hoạt chất tương thích.",
    },
    {
      session: "Buổi 3",
      title: "Xây dựng phác đồ phối hợp hoạt chất",
      description: "Thực hành kết hợp các dòng sản phẩm DESEMBRE cao cấp theo chuẩn quy trình y khoa.",
    },
    {
      session: "Buổi 4",
      title: "Case study & Xử lý tình huống thực tế",
      description: "Phân tích các ca lâm sàng phức tạp, giải đáp thắc mắc và chuyển giao quy trình cho Spa/Clinic.",
    },
  ];

  return (
    <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
          <BookOpen className="w-4 h-4" />
          <span>Nội dung đào tạo</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Nội dung các buổi học
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Lộ trình lý thuyết kết hợp thực hành giúp học viên làm chủ kiến thức nhanh chóng.
        </p>
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((s, idx) => (
            <div
              key={s.id || idx}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm sm:text-base">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-extrabold shrink-0">
                    {idx + 1}
                  </span>
                  <span>{s.title || `Buổi ${idx + 1}`}</span>
                </div>
                {s.description && (
                  <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                    {s.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pl-8 sm:pl-0 shrink-0">
                {s.starts_at && (
                  <div className="flex items-center gap-1.5 font-medium text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200/70">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>
                      {formatDateSafe(s.starts_at, "dd/MM")}{" "}
                      ({formatTimeRange(s.starts_at, s.ends_at)})
                    </span>
                  </div>
                )}

                {s.location_detail && (
                  <div className="flex items-center gap-1.5 text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200/70">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[160px]">{s.location_detail}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fallbackCurriculum.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold text-[10px] uppercase">
                    {item.session}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    {item.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Lịch học chi tiết sẽ được DESEMBRE Academy xác nhận qua Zalo/SĐT khi lớp mở tuyển sinh chính thức.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
