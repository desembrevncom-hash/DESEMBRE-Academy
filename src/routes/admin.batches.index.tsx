import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminGetCourseBatches } from "@/features/admin/services/academyAdminBatchesApi";
import { Loader2, Plus, AlertCircle, Edit, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { isDemoRecord } from "@/features/admin/utils/demoData";

export const Route = createFileRoute("/admin/batches/")({
  component: AdminBatchesIndexPage,
});

function AdminBatchesIndexPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "draft" | "closed" | "demo">("all");

  useEffect(() => {
    let mounted = true;
    async function loadBatches() {
      try {
        setLoading(true);
        const data = await adminGetCourseBatches();
        if (mounted) {
          setBatches(data || []);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Không thể tải danh sách lớp học");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    loadBatches();
    return () => { mounted = false; };
  }, []);

  const filteredBatches = batches.filter((batch) => {
    const isDemo = isDemoRecord(batch);
    if (statusFilter === "demo") return isDemo;
    if (isDemo) return false;
    if (statusFilter === "all") return true;
    const regStatus = (batch.registration_status || batch.status || "open").toLowerCase();
    return regStatus === statusFilter;
  });

  const handleCloseDemo = async (batch: any) => {
    if (!window.confirm("Đóng đăng ký lớp dữ liệu test này?")) return;
    try {
      const { adminUpdateCourseBatch } = await import("@/features/admin/services/academyAdminBatchesApi");
      await adminUpdateCourseBatch(batch.id, {
        course_id: batch.course_id,
        title: batch.title,
        slug: batch.slug,
        training_format: batch.training_format,
        instructor_id: batch.instructor_id,
        max_participants: batch.max_participants,
        start_date: batch.start_date,
        end_date: batch.end_date,
        registration_closes_at: batch.registration_closes_at,
        description: batch.description,
        registration_status: "closed",
      });
      const data = await adminGetCourseBatches();
      setBatches(data || []);
    } catch (err) {
      alert("Lỗi khi đóng đăng ký lớp test");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Lớp đào tạo</h1>
          <p className="text-muted-foreground mt-2">Quản lý lớp đào tạo và theo dõi đăng ký học viên.</p>
        </div>
        <Button asChild>
          <Link to="/admin/batches/new">
            <Plus className="mr-2 h-4 w-4" /> Tạo lớp mới
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
        >
          <option value="all">Đang hoạt động</option>
          <option value="open">Đang mở đăng ký</option>
          <option value="draft">Bản nháp</option>
          <option value="closed">Đã đóng</option>
          <option value="demo">Dữ liệu test/smoke</option>
        </select>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && filteredBatches.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
          Chưa có lớp nào trong mục này.
        </div>
      )}

      {!loading && !error && filteredBatches.length > 0 && (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Lớp / Batch</th>
                <th className="px-5 py-3.5 font-semibold">Khóa học</th>
                <th className="px-5 py-3.5 font-semibold">Giảng viên</th>
                <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
                <th className="px-5 py-3.5 font-semibold">Buổi học</th>
                <th className="px-5 py-3.5 font-semibold">Số chỗ</th>
                <th className="px-5 py-3.5 font-semibold">Thời gian</th>
                <th className="px-5 py-3.5 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredBatches.map((batch) => {
                const regStatus = (batch.registration_status || batch.status || "open").toLowerCase();
                const instructorName = batch.instructor?.full_name || "Chưa gán";
                const courseSlug = batch.course?.slug;
                const sessionsCount = batch.sessions_count ?? (Array.isArray(batch.sessions) ? batch.sessions.length : 0);

                return (
                  <tr key={batch.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {batch.title}
                        {isDemoRecord(batch) && (
                          <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                            Dữ liệu test
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground text-xs">{batch.slug}</div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground font-medium">
                      {batch.course?.title || batch.course_title || batch.course_id}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">
                      {instructorName}
                    </td>
                    <td className="px-5 py-3.5">
                      {regStatus === "open" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Đang mở đăng ký
                        </span>
                      )}
                      {regStatus === "closed" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Đã đóng
                        </span>
                      )}
                      {regStatus === "draft" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Bản nháp
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {sessionsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                          {sessionsCount} buổi học
                        </span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md w-max">
                            Chưa có lịch học
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {batch.max_participants ? `${batch.max_participants} chỗ` : "Không giới hạn"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {batch.start_date ? format(parseISO(batch.start_date), "dd/MM/yyyy") : "-"}
                      {batch.end_date ? ` – ${format(parseISO(batch.end_date), "dd/MM/yyyy")}` : ""}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <Link
                        to="/admin/batches/$batchId"
                        params={{ batchId: batch.id }}
                        search={{ addSession: true } as any}
                        className="inline-flex items-center justify-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 h-8 px-2.5 rounded-md"
                      >
                        + Thêm buổi học
                      </Link>
                      <Link 
                        to="/admin/batches/$batchId/registrations" 
                        params={{ batchId: batch.id }}
                        className="inline-flex items-center justify-center gap-1 text-xs font-medium border border-input bg-background shadow-xs hover:bg-accent h-8 px-2.5 rounded-md"
                      >
                        <Users className="h-3.5 w-3.5" /> Leads
                      </Link>
                      <Link 
                        to="/admin/batches/$batchId" 
                        params={{ batchId: batch.id }}
                        search={{ addSession: false } as any}
                        className="inline-flex items-center justify-center gap-1 text-xs font-medium bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-8 px-2.5 rounded-md"
                      >
                        <Edit className="h-3.5 w-3.5" /> Sửa
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
