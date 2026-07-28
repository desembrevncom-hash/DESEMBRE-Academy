import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminGetCourseBatches } from "@/features/admin/services/academyAdminBatchesApi";
import { Loader2, Plus, AlertCircle, Edit, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export const Route = createFileRoute("/admin/batches/")({
  component: AdminBatchesIndexPage,
});

function AdminBatchesIndexPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setError(err.message || "Failed to load batches");
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batches Management</h1>
          <p className="text-muted-foreground mt-2">Manage monthly funnel course batches and registrations</p>
        </div>
        <Button asChild>
          <Link to="/admin/batches/new">
            <Plus className="mr-2 h-4 w-4" /> Create Batch
          </Link>
        </Button>
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

      {!loading && !error && batches.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
          No batches found. Create your first batch to get started.
        </div>
      )}

      {!loading && !error && batches.length > 0 && (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Lớp / Batch</th>
                <th className="px-5 py-3.5 font-semibold">Khóa học</th>
                <th className="px-5 py-3.5 font-semibold">Giảng viên</th>
                <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
                <th className="px-5 py-3.5 font-semibold">Số chỗ</th>
                <th className="px-5 py-3.5 font-semibold">Thời gian</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {batches.map((batch) => {
                const regStatus = (batch.registration_status || batch.status || "open").toLowerCase();
                const instructorName = batch.instructor?.full_name || "Chưa gán";
                const courseSlug = batch.course?.slug;

                return (
                  <tr key={batch.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-foreground">{batch.title}</div>
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
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {batch.max_participants ? `${batch.max_participants} chỗ` : "Không giới hạn"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {batch.start_date ? format(parseISO(batch.start_date), "dd/MM/yyyy") : "-"}
                      {batch.end_date ? ` – ${format(parseISO(batch.end_date), "dd/MM/yyyy")}` : ""}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <Link
                        to="/lich-khai-giang"
                        target="_blank"
                        className="text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        Lịch public ↗
                      </Link>
                      {courseSlug && (
                        <Link
                          to="/khoa-hoc/$slug"
                          params={{ slug: courseSlug }}
                          target="_blank"
                          className="text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          Khóa học ↗
                        </Link>
                      )}
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
                        className="inline-flex items-center justify-center gap-1 text-xs font-medium bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-8 px-2.5 rounded-md"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
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
