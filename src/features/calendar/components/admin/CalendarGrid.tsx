import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import { SessionCard } from "./SessionCard";

interface CalendarGridProps {
  currentDate: Date;
  sessions: any[];
  onSessionClick: (session: any) => void;
}

export function CalendarGrid({ currentDate, sessions, onSessionClick }: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 min-w-[700px] border-t border-l">
        {weekDays.map(day => (
          <div key={day} className="bg-muted/50 border-r border-b p-2 text-center text-sm font-semibold text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((day, idx) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const daySessions = sessions.filter(s => s.starts_at && s.starts_at.startsWith(dateStr));
          const isCurrMonth = isSameMonth(day, monthStart);
          const isCurrDay = isToday(day);

          return (
            <div 
              key={idx} 
              className={`min-h-[120px] p-2 border-r border-b ${!isCurrMonth ? 'bg-muted/20 text-muted-foreground' : 'bg-background'} ${isCurrDay ? 'bg-primary/5' : ''}`}
            >
              <div className="flex justify-end">
                <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ${isCurrDay ? 'bg-primary text-primary-foreground' : ''}`}>
                  {format(day, dateFormat)}
                </span>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {daySessions.map(session => (
                  <SessionCard 
                    key={session.id} 
                    session={session} 
                    onClick={() => onSessionClick(session)} 
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
