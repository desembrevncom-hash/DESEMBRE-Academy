import { format, parseISO, isFuture } from "date-fns";
import { Calendar } from "lucide-react";

export function UpcomingSessions({ sessions, onSessionClick }: { sessions: any[], onSessionClick: (session: any) => void }) {
  const upcoming = sessions
    .filter(s => s.starts_at && isFuture(parseISO(s.starts_at)))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 7);

  if (upcoming.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-6 flex flex-col items-center justify-center text-center">
        <Calendar className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
        <p className="text-sm font-medium">Không có lịch sắp tới</p>
        <p className="text-xs text-muted-foreground mt-1">Lịch học trong tương lai sẽ xuất hiện ở đây.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold text-sm">Buổi học sắp tới</h3>
      </div>
      <div className="p-2 flex flex-col gap-1">
        {upcoming.map(session => {
          const batch = session.course_batches;
          const course = batch?.courses;
          return (
            <div 
              key={session.id} 
              onClick={() => onSessionClick(session)}
              className="p-3 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
            >
              <div className="font-medium text-sm mb-1">{course?.title || batch?.title || session.title}</div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {format(parseISO(session.starts_at), "dd/MM/yyyy HH:mm")}
                </span>
                <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] uppercase font-medium">
                  {batch?.training_format || session.location_type || "N/A"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
