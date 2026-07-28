import { format, parseISO } from "date-fns";
import { Users } from "lucide-react";

export function SessionCard({ session, onClick }: { session: any, onClick: () => void }) {
  const batch = session.course_batches;
  const course = batch?.courses;
  const studentCount: number = Number(session.student_count ?? session.registration_count ?? 0);
  
  const status = (session.status || 'scheduled').toLowerCase();
  
  let borderColor = "border-l-blue-500";
  let cardOpacity = "";
  if (status === 'ongoing') {
    borderColor = "border-l-green-500";
  } else if (status === 'completed') {
    borderColor = "border-l-gray-400";
    cardOpacity = "opacity-70";
  } else if (status === 'cancelled') {
    borderColor = "border-l-red-300";
    cardOpacity = "opacity-50";
  }

  return (
    <div 
      onClick={onClick}
      className={`border-l-4 ${borderColor} ${cardOpacity} bg-card hover:bg-muted/50 transition-colors p-2 rounded-r-md border-y border-r cursor-pointer text-sm shadow-sm flex flex-col gap-1 mb-2`}
    >
      <div className="font-semibold text-xs truncate" title={session.title || course?.title || batch?.title}>
        {session.title || course?.title || batch?.title || "—"}
      </div>
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{session.starts_at ? format(parseISO(session.starts_at), "HH:mm") : "TBA"}</span>
        <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] uppercase font-medium">
          {batch?.training_format || session.location_type || "N/A"}
        </span>
      </div>
      {status !== 'cancelled' && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
          <Users className="h-2.5 w-2.5" />
          <span>
            {studentCount > 0 ? `${studentCount} học viên` : "Chưa có học viên"}
          </span>
        </div>
      )}
    </div>
  );
}
