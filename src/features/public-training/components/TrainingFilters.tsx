import { Video, MapPin, MonitorPlay, Calendar, Filter, RotateCcw } from "lucide-react";
import { FORMAT_OPTIONS } from "./TrainingFiltersData";

export interface TrainingFiltersProps {
  selectedFormat: string;
  onSelectFormat: (format: string) => void;
  months: string[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onResetFilters?: () => void;
  totalResults?: number;
}

export function TrainingFilters({
  selectedFormat,
  onSelectFormat,
  months,
  selectedMonth,
  onSelectMonth,
  onResetFilters,
  totalResults,
}: TrainingFiltersProps) {
  const isFiltered = selectedFormat !== "ALL" || selectedMonth !== "ALL";

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
      {/* Format filters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Hình thức đào tạo</span>
          </div>

          {isFiltered && onResetFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {/* Scrollable container on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {FORMAT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedFormat === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onSelectFormat(opt.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-slate-50 text-slate-600 border border-slate-200/70 hover:bg-slate-100 hover:text-slate-900"
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
        <div className="pt-3.5 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tháng khai giảng</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            <button
              onClick={() => onSelectMonth("ALL")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
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
