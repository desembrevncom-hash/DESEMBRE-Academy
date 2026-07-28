import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock, XCircle, Users } from "lucide-react";
import { isToday, isFuture, parseISO } from "date-fns";

export function CalendarStats({ sessions }: { sessions: any[] }) {
  const activeSessions = sessions.filter(s => s.status !== 'completed' && s.status !== 'cancelled');
  
  const todaySessions = activeSessions.filter(s => s.starts_at && isToday(parseISO(s.starts_at)));
  const upcomingSessions = activeSessions.filter(s => s.starts_at && isFuture(parseISO(s.starts_at)) && !isToday(parseISO(s.starts_at)));
  
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const cancelledSessions = sessions.filter(s => s.status === 'cancelled');

  // Total confirmed students across all unique batches (deduplicated by batch_id)
  const seenBatches = new Set<string>();
  let totalStudents = 0;
  for (const s of sessions) {
    if (s.batch_id && !seenBatches.has(s.batch_id)) {
      seenBatches.add(s.batch_id);
      totalStudents += Number(s.student_count ?? s.registration_count ?? 0);
    }
  }

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Buổi học hôm nay</CardTitle>
          <Calendar className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{todaySessions.length}</div>
          <p className="text-xs text-muted-foreground">Đang hoặc sẽ diễn ra</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sắp diễn ra</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-500">{upcomingSessions.length}</div>
          <p className="text-xs text-muted-foreground">Trong tương lai</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-600">{completedSessions.length}</div>
          <p className="text-xs text-muted-foreground">Các buổi đã kết thúc</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đã hủy</CardTitle>
          <XCircle className="h-4 w-4 text-destructive/70" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive/70">{cancelledSessions.length}</div>
          <p className="text-xs text-muted-foreground">Buổi học bị hủy</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Học viên đăng ký</CardTitle>
          <Users className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-600">{totalStudents}</div>
          <p className="text-xs text-muted-foreground">
            {totalStudents === 0 ? "Chưa có học viên" : "Đã đăng ký (tất cả trạng thái)"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
