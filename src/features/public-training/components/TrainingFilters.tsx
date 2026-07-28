import { Video, MapPin, MonitorPlay, Calendar, Filter } from "lucide-react";

export const FORMAT_OPTIONS = [
  { id: "ALL", label: "Tất cả hình thức", icon: Calendar },
  { id: "office", label: "Văn phòng (Offline)", icon: MapPin },
  { id: "zoom", label: "Zoom Online", icon: Video },
  { id: "hybrid", label: "Hybrid", icon: MonitorPlay },
  { id: "external_seminar", label: "Seminar ngoài", icon: Calendar },
];

interface TrainingFiltersProps {
  selectedFormat: string;
  onSelectFormat: (format: string) => void;
  months: string[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

export function TrainingFilters({
  selectedFormat,
  onSelectFormat,
  months,
  selectedMonth,
  onSelectMonth,
}: TrainingFiltersProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
      {/* Format filters */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          <Filter className="w-3.5 h-3.5" />
          <span>Hình thức đào tạo</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedFormat === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onSelectFormat(opt.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "bg-slate-50 text-slate-600 border border-slate-200/60 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-400"}`} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Month filters */}
      {months.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            <Calendar className="w-3.5 h-3.5" />
            <span>Tháng khai giảng</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onSelectMonth("ALL")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMonth === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tất cả tháng
            </button>
            {months.map((m) => (
              <button
                key={m}
                onClick={() => onSelectMonth(m)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedMonth === m
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m !== "TBA" ? `Tháng ${m}` : "Chưa xếp ngày"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
