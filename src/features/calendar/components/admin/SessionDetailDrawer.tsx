import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { MapPin, Video, Users, BookOpen, Clock, Tag, Loader2, CheckCircle2, XCircle, Clock4, CalendarX2, Download } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { 
  getSessionParticipantsWithAttendance,
  upsertSessionAttendance,
  type SessionParticipantWithAttendance,
  type AttendanceStatus
} from "../../services/academyCalendarApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface SessionDetailDrawerProps {
  session: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (session: any) => void;
  onDelete?: (session: any) => void;
  onMarkCompleted?: (session: any) => void;
  onCancelSession?: (session: any) => void;
  onReopen?: (session: any) => void;
}

export function SessionDetailDrawer({ 
  session, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete,
  onMarkCompleted,
  onCancelSession,
  onReopen
}: SessionDetailDrawerProps) {
  if (!session) return null;
  
  const batch = session.course_batches;
  const course = batch?.courses;
  const isZoom = session.location_type === "zoom" || batch?.training_format === "zoom";
  const status = (session.status || 'scheduled').toLowerCase();

  const [participants, setParticipants] = useState<SessionParticipantWithAttendance[]>([]);
  const [isLoadingRegs, setIsLoadingRegs] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [updatingRow, setUpdatingRow] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && session?.id) {
      let isMounted = true;
      setIsLoadingRegs(true);
      setRegError(null);
      
      getSessionParticipantsWithAttendance(session.id)
        .then((data) => {
          if (isMounted) setParticipants(data);
        })
        .catch((err) => {
          if (isMounted) setRegError(err.message || "Lỗi tải danh sách học viên");
        })
        .finally(() => {
          if (isMounted) setIsLoadingRegs(false);
        });
      return () => { isMounted = false; };
    }
  }, [isOpen, session?.id]);

  const handleAttendanceChange = async (registrationId: string, newStatus: AttendanceStatus) => {
    if (!session?.id) return;
    
    if (status === 'cancelled') {
      toast.error("Không thể điểm danh buổi học đã hủy");
      return;
    }
    
    if (status === 'completed' && !window.confirm("Buổi học đã hoàn thành. Bạn có chắc muốn sửa điểm danh?")) {
      return;
    }

    setUpdatingRow(registrationId);
    try {
      await upsertSessionAttendance({
        sessionId: session.id,
        registrationId,
        status: newStatus
      });
      
      setParticipants(prev => prev.map(p =>
        p.registration_id === registrationId
          ? { ...p, attendance_status: newStatus }
          : p
      ));
      toast.success("Đã cập nhật điểm danh");
    } catch (error: any) {
      toast.error(error.message || "Lỗi cập nhật điểm danh");
    } finally {
      setUpdatingRow(null);
    }
  };

  const attendanceStats = participants.reduce(
    (acc, p) => {
      const attStatus = (p.attendance_status || 'not_marked') as string;
      acc[attStatus] = (acc[attStatus] || 0) + 1;
      acc.total += 1;
      return acc;
    },
    { total: 0, not_marked: 0, present: 0, absent: 0, late: 0, excused: 0 } as Record<string, number>
  );

  const handleMarkCompleted = () => {
    if (!onMarkCompleted) return;
    const unmarked = attendanceStats.not_marked || 0;
    if (unmarked > 0) {
      if (!window.confirm(`Buổi học còn ${unmarked} học viên chưa điểm danh. Bạn vẫn muốn hoàn thành?`)) {
        return;
      }
    }
    onMarkCompleted(session);
  };

  const escapeCsvField = (value: string | null | undefined): string => {
    if (value == null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const attendanceStatusLabel = (s: string): string => {
    switch (s) {
      case 'present': return 'Có mặt';
      case 'absent': return 'Vắng mặt';
      case 'late': return 'Đi muộn';
      case 'excused': return 'Có phép';
      default: return 'Chưa điểm danh';
    }
  };

  const handleExportCsv = () => {
    try {
      const headers = [
        'Buổi học', 'Khóa học', 'Lớp', 'Thời gian',
        'Học viên', 'SĐT', 'Email', 'Trạng thái đăng ký',
        'Điểm danh', 'Check-in', 'Ghi chú'
      ];
      const sessionTitle = session.title || 'Buoi hoc';
      const courseTitle = course?.title || '';
      const batchTitle = batch?.title || '';
      const sessionStart = session.starts_at ? format(parseISO(session.starts_at), 'dd/MM/yyyy HH:mm') : '';

      const rows = participants.map(p => [
        escapeCsvField(sessionTitle),
        escapeCsvField(courseTitle),
        escapeCsvField(batchTitle),
        escapeCsvField(sessionStart),
        escapeCsvField(p.full_name),
        escapeCsvField(p.phone),
        escapeCsvField(p.email),
        escapeCsvField(p.registration_status),
        escapeCsvField(attendanceStatusLabel(p.attendance_status || 'not_marked')),
        escapeCsvField(p.checked_in_at ? format(parseISO(p.checked_in_at), 'dd/MM/yyyy HH:mm') : ''),
        escapeCsvField(p.attendance_note)
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeTitle = sessionTitle.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s_-]/g, '').replace(/\s+/g, '_').slice(0, 50);
      const dateStr = session.starts_at ? format(parseISO(session.starts_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      link.href = url;
      link.download = `attendance_${safeTitle}_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Đã xuất file CSV');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xuất CSV');
    }
  };

  const getStatusBadge = () => {
    switch(status) {
      case 'completed': return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium border">Đã hoàn thành</span>;
      case 'cancelled': return <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-medium border border-red-200">Đã hủy</span>;
      case 'ongoing': return <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-medium border border-green-200">Đang diễn ra</span>;
      default: return <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-200">Đã lên lịch</span>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6 mt-4">
          <div className="flex justify-between items-start gap-4">
            <SheetTitle>{session.title || "Chi tiết buổi học"}</SheetTitle>
            {getStatusBadge()}
          </div>
          <SheetDescription>
            Thông tin chi tiết và hành động cho buổi học.
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Thông tin chung</h4>
            
            <div className="flex gap-3 items-start">
              <BookOpen className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Khóa học</div>
                <div className="text-sm text-muted-foreground">{course?.title || "—"}</div>
              </div>
            </div>
            
            <div className="flex gap-3 items-start">
              <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Lớp (Batch)</div>
                <div className="text-sm text-muted-foreground">{batch?.title || "—"}</div>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Thời gian</div>
                <div className="text-sm text-muted-foreground">
                  {session.starts_at ? format(parseISO(session.starts_at), "dd/MM/yyyy") : "TBA"} <br/>
                  {session.starts_at ? format(parseISO(session.starts_at), "HH:mm") : ""}
                  {session.ends_at ? ` – ${format(parseISO(session.ends_at), "HH:mm")}` : ""}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 items-start">
              {isZoom ? <Video className="h-4 w-4 mt-0.5 text-muted-foreground" /> : <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />}
              <div>
                <div className="text-sm font-medium">Địa điểm / Hình thức</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {(batch?.training_format || session.location_type || "N/A").replace("_", " ")}
                </div>
                {session.location_detail && (
                  <div className="text-sm text-muted-foreground mt-1 bg-muted p-2 rounded-md break-all">
                    {session.location_detail}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 items-start">
              <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Số học viên</div>
                {(() => {
                  const total: number = Number(session.student_count ?? session.registration_count ?? 0);
                  const confirmed: number = session.confirmed_student_count ?? 0;
                  if (total === 0) {
                    return <div className="text-sm text-muted-foreground italic">Chưa có học viên</div>;
                  }
                  return (
                    <div className="text-sm text-foreground font-medium">
                      {total} học viên
                      {confirmed > 0 && confirmed < total && (
                        <span className="text-muted-foreground font-normal ml-1">({confirmed} đã xác nhận)</span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Nội dung / Ghi chú</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {session.description || "Không có nội dung chi tiết."}
            </div>
          </div>

          <div className="space-y-3 mt-6 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Danh sách học viên đăng ký</h4>
              {participants.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleExportCsv}>
                  <Download className="h-3.5 w-3.5" /> Xuất CSV
                </Button>
              )}
            </div>
            
            {isLoadingRegs ? (
              <div className="flex items-center justify-center py-4 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Đang tải danh sách...</span>
              </div>
            ) : regError ? (
              <div className="text-sm text-red-500 py-2 bg-red-50 px-3 rounded">
                Lỗi: {regError}
              </div>
            ) : participants.length === 0 ? (
              <div className="text-sm text-muted-foreground italic py-2">
                Chưa có học viên nào đăng ký khóa học này.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-muted p-2 rounded flex flex-col items-center justify-center">
                    <span className="text-muted-foreground">Sĩ số</span>
                    <span className="font-semibold text-sm">{attendanceStats.total}</span>
                  </div>
                  <div className="bg-green-50 p-2 rounded flex flex-col items-center justify-center">
                    <span className="text-green-700">Có mặt</span>
                    <span className="font-semibold text-green-700 text-sm">{attendanceStats.present}</span>
                  </div>
                  <div className="bg-red-50 p-2 rounded flex flex-col items-center justify-center">
                    <span className="text-red-700">Vắng</span>
                    <span className="font-semibold text-red-700 text-sm">{attendanceStats.absent}</span>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded flex flex-col items-center justify-center">
                    <span className="text-yellow-700">Đi muộn</span>
                    <span className="font-semibold text-yellow-700 text-sm">{attendanceStats.late}</span>
                  </div>
                  <div className="bg-blue-50 p-2 rounded flex flex-col items-center justify-center">
                    <span className="text-blue-700">Có phép</span>
                    <span className="font-semibold text-blue-700 text-sm">{attendanceStats.excused}</span>
                  </div>
                  <div className="bg-gray-100 p-2 rounded flex flex-col items-center justify-center">
                    <span className="text-gray-600">Chưa điểm danh</span>
                    <span className="font-semibold text-gray-700 text-sm">{attendanceStats.not_marked}</span>
                  </div>
                </div>

                {/* Table */}
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Học viên</th>
                        <th className="px-3 py-2 font-medium w-[130px]">Điểm danh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {participants.map(p => {
                        const attStatus = p.attendance_status || 'not_marked';
                        const isUpdating = updatingRow === p.registration_id;
                        
                        return (
                          <tr key={p.registration_id} className="bg-card hover:bg-muted/20">
                            <td className="px-3 py-2">
                              <div className="font-medium text-foreground flex items-center gap-2">
                                {p.full_name}
                                {p.registration_status !== 'confirmed' && (
                                  <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1 rounded uppercase">
                                    {p.registration_status}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                                {p.phone || p.email || "Không có liên hệ"}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              {isUpdating ? (
                                <div className="flex items-center justify-center h-8">
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                              ) : (
                                <Select 
                                  value={attStatus} 
                                  onValueChange={(val) => handleAttendanceChange(p.registration_id, val as AttendanceStatus)}
                                  disabled={status === 'cancelled'}
                                >
                                  <SelectTrigger className="h-8 text-xs w-full bg-white">
                                    <SelectValue placeholder="Chọn..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="not_marked"><span className="text-gray-500">Chưa ĐD</span></SelectItem>
                                    <SelectItem value="present"><span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Có mặt</span></SelectItem>
                                    <SelectItem value="absent"><span className="text-red-600 font-medium flex items-center gap-1"><XCircle className="h-3 w-3"/> Vắng mặt</span></SelectItem>
                                    <SelectItem value="late"><span className="text-yellow-600 font-medium flex items-center gap-1"><Clock4 className="h-3 w-3"/> Đi muộn</span></SelectItem>
                                    <SelectItem value="excused"><span className="text-blue-600 font-medium flex items-center gap-1"><CalendarX2 className="h-3 w-3"/> Có phép</span></SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {status === 'cancelled' && session.cancellation_reason && (
            <div className="space-y-3 bg-red-50 p-3 rounded-md border border-red-100">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-red-800">Lý do hủy</h4>
              <div className="text-sm text-red-700 whitespace-pre-wrap">
                {session.cancellation_reason}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="mt-8 flex-col sm:flex-row gap-2 justify-between w-full">
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            {status !== 'completed' && status !== 'cancelled' && onMarkCompleted && (
              <Button variant="default" className="w-full sm:w-auto" onClick={handleMarkCompleted}>
                Đánh dấu hoàn thành
              </Button>
            )}
            
            {status !== 'completed' && status !== 'cancelled' && onEdit && (
              <Button variant="secondary" className="w-full sm:w-auto" onClick={() => onEdit(session)}>
                Sửa
              </Button>
            )}
            
            {(status === 'completed' || status === 'cancelled') && onReopen && (
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => onReopen(session)}>
                Mở lại (Reopen)
              </Button>
            )}

            {status !== 'cancelled' && onCancelSession && (
              <Button variant="destructive" className="w-full sm:w-auto bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800" onClick={() => onCancelSession(session)}>
                Hủy buổi học
              </Button>
            )}
            
            {onDelete && status === 'scheduled' && (
              <Button variant="ghost" className="w-full sm:w-auto text-destructive hover:bg-destructive/10" onClick={() => onDelete(session)}>
                Xóa
              </Button>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-4 sm:mt-0">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Đóng</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
