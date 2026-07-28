import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function CalendarHeader({ onAddSession, onToday }: { onAddSession: () => void, onToday: () => void }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lịch đào tạo</h1>
        <p className="text-muted-foreground mt-1">Quản lý lịch học, lớp khai giảng và onboarding đối tác.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onToday}>Hôm nay</Button>
        <Button onClick={onAddSession}>
          <Plus className="h-4 w-4 mr-2" /> Thêm buổi học
        </Button>
      </div>
    </div>
  );
}
