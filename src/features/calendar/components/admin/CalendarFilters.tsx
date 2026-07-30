import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarFiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterFormat: string;
  setFilterFormat: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  monthLabel: string;
}

export function CalendarFilters({
  searchTerm, setSearchTerm,
  filterFormat, setFilterFormat,
  filterStatus, setFilterStatus,
  onPrevMonth, onNextMonth, monthLabel
}: CalendarFiltersProps) {
  const selCls = "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-3 rounded-lg border mb-6">
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={onPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-semibold text-sm w-[130px] text-center">{monthLabel}</div>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={onNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="relative w-full md:w-[250px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm theo khóa học, batch..." 
            className="pl-9 h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select value={filterFormat} onChange={e => setFilterFormat(e.target.value)} className={selCls}>
          <option value="ALL">Tất cả format</option>
          <option value="office">Office</option>
          <option value="zoom">Zoom</option>
          <option value="hybrid">Hybrid</option>
        </select>
        
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selCls}>
          <option value="ACTIVE">Đang hoạt động (Lớp mở)</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="CLOSED">Đã đóng</option>
          <option value="ALL">Tất cả trạng thái (Gồm bản nháp)</option>
          <option value="DEMO">Dữ liệu test/smoke</option>
        </select>
      </div>
    </div>
  );
}
