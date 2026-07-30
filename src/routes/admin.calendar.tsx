import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { getAdminCalendar } from "@/features/calendar/services/academyCalendarApi";
import { Loader2 } from "lucide-react";
import { addMonths, format, isSameMonth, parseISO, subMonths } from "date-fns";
import { vi } from "date-fns/locale";

import { CalendarHeader } from "@/features/calendar/components/admin/CalendarHeader";
import { CalendarStats } from "@/features/calendar/components/admin/CalendarStats";
import { CalendarFilters } from "@/features/calendar/components/admin/CalendarFilters";
import { CalendarGrid } from "@/features/calendar/components/admin/CalendarGrid";
import { UpcomingSessions } from "@/features/calendar/components/admin/UpcomingSessions";
import { SessionDetailDrawer } from "@/features/calendar/components/admin/SessionDetailDrawer";
import { SessionFormDrawer } from "@/features/calendar/components/admin/SessionFormDrawer";
import { academyAdminCoursesApi } from "@/features/admin/services/academyAdminCoursesApi";
import { adminGetCourseBatches } from "@/features/admin/services/academyAdminBatchesApi";
import { 
  adminCreateSession, 
  adminUpdateSession, 
  adminDeleteSession,
  adminMarkSessionCompleted,
  adminCancelSession,
  adminReopenSession
} from "@/features/admin/services/academyAdminSessionsApi";
import { toast } from "sonner";

import { isDemoRecord } from "@/features/admin/utils/demoData";

export const Route = createFileRoute("/admin/calendar")({
  component: AdminCalendarPage,
});

function AdminCalendarPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterFormat, setFilterFormat] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ACTIVE");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sData, cData, bData] = await Promise.all([
        getAdminCalendar(),
        academyAdminCoursesApi.listCourses(),
        adminGetCourseBatches()
      ]);
      setSessions(sData);
      setCourses(cData);
      setBatches(bData);
    } catch (err: any) {
      setError(err.message || "Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToday = useCallback(() => setCurrentDate(new Date()), []);
  const handlePrevMonth = useCallback(() => setCurrentDate(d => subMonths(d, 1)), []);
  const handleNextMonth = useCallback(() => setCurrentDate(d => addMonths(d, 1)), []);

  const handleAddSession = () => {
    setSessionToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditSession = (session: any) => {
    setSessionToEdit(session);
    setSelectedSession(null);
    setIsFormOpen(true);
  };

  const handleDeleteSession = async (session: any) => {
    if (!confirm("Bạn có chắc chắn muốn xóa buổi học này?")) return;
    try {
      await adminDeleteSession(session.id);
      toast.success("Đã xóa buổi học");
      setSelectedSession(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xóa buổi học");
    }
  };

  const handleFormSubmit = async (payload: any) => {
    if (sessionToEdit) {
      await adminUpdateSession(sessionToEdit.id, payload);
    } else {
      await adminCreateSession(payload);
    }
    loadData();
  };

  const handleMarkCompleted = async (session: any) => {
    try {
      await adminMarkSessionCompleted(session.id);
      toast.success("Đã cập nhật trạng thái: Hoàn thành");
      setSelectedSession(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi cập nhật");
    }
  };

  const handleCancelSession = async (session: any) => {
    const reason = window.prompt("Nhập lý do hủy buổi học:");
    if (reason === null) return; // User cancelled prompt
    
    try {
      await adminCancelSession(session.id, reason);
      toast.success("Đã hủy buổi học");
      setSelectedSession(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi hủy buổi học");
    }
  };

  const handleReopenSession = async (session: any) => {
    try {
      await adminReopenSession(session.id);
      toast.success("Đã mở lại buổi học");
      setSelectedSession(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi mở lại");
    }
  };

  const monthLabel = format(currentDate, "MMMM yyyy", { locale: vi });

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      const batch = s.course_batches;
      const course = batch?.courses;
      if (!batch) return false;

      const isTestRecord = isDemoRecord(s) || isDemoRecord(batch) || isDemoRecord(course || {});
      if (filterStatus === "DEMO") return isTestRecord;
      if (isTestRecord) return false;

      const fmt = (batch.training_format || s.location_type || "").toLowerCase();
      const status = (batch.registration_status || batch.status || "open").toLowerCase().trim();

      const matchFmt = filterFormat === "ALL" || fmt === filterFormat.toLowerCase();
      
      let matchStatus = true;
      if (filterStatus === "ACTIVE" || filterStatus === "OPEN") {
        matchStatus = (status === "open" || status === "published" || status === "upcoming" || status === "ongoing");
      } else if (filterStatus === "DRAFT") {
        matchStatus = (status === "draft");
      } else if (filterStatus === "CLOSED") {
        matchStatus = (status === "closed" || status === "cancelled" || status === "archived");
      } else if (filterStatus === "ALL") {
        matchStatus = true;
      }

      const matchSearch = !searchTerm ||
        (course?.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (batch?.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.title || "").toLowerCase().includes(searchTerm.toLowerCase());

      return matchFmt && matchStatus && matchSearch;
    });
  }, [sessions, filterFormat, filterStatus, searchTerm]);

  // Filter to current month for the grid
  const monthSessions = useMemo(() => {
    return filtered.filter(s => s.starts_at && isSameMonth(parseISO(s.starts_at), currentDate));
  }, [filtered, currentDate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="bg-destructive/10 border border-destructive/30 text-destructive p-6 rounded-lg text-center">
          <p className="font-semibold mb-1">Không thể tải lịch đào tạo</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl space-y-6">
      {/* A. Header */}
      <CalendarHeader
        onAddSession={handleAddSession}
        onToday={handleToday}
      />

      {/* B. Stats cards */}
      <CalendarStats sessions={sessions} />

      {/* C. Filter bar */}
      <CalendarFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterFormat={filterFormat}
        setFilterFormat={setFilterFormat}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        monthLabel={monthLabel}
      />

      {/* D. Main 2-column content */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Left: Calendar Grid */}
        <div className="border rounded-lg overflow-x-auto bg-card">
          {monthSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="font-medium text-muted-foreground">Không có buổi học nào trong tháng này</p>
              <p className="text-sm text-muted-foreground mt-1">Thử điều chỉnh bộ lọc hoặc chuyển tháng.</p>
            </div>
          ) : (
            <CalendarGrid
              currentDate={currentDate}
              sessions={monthSessions}
              onSessionClick={setSelectedSession}
            />
          )}
        </div>

        {/* Right: Upcoming Sessions */}
        <div className="flex flex-col gap-4">
          <UpcomingSessions sessions={filtered} onSessionClick={setSelectedSession} />
        </div>
      </div>

      {/* E. Detail Drawer */}
      <SessionDetailDrawer
        session={selectedSession}
        isOpen={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
        onEdit={handleEditSession}
        onDelete={handleDeleteSession}
        onMarkCompleted={handleMarkCompleted}
        onCancelSession={handleCancelSession}
        onReopen={handleReopenSession}
      />

      <SessionFormDrawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        sessionToEdit={sessionToEdit}
        courses={courses}
        batches={batches}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
