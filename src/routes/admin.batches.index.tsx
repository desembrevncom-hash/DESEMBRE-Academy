import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminGetCourseBatches } from "@/features/admin/services/academyAdminBatchesApi";
import { Loader2, Plus, AlertCircle, Edit, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { isDemoRecord } from "@/features/admin/utils/demoData";
import { isOneSessionCourseType } from "@/features/admin/constants";
import { AddSessionModal } from "@/features/admin/components/AddSessionModal";

export const Route = createFileRoute("/admin/batches/")({
  component: AdminBatchesIndexPage,
});

function AdminBatchesIndexPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "draft" | "closed" | "demo">("all");
  const [selectedBatchForSession, setSelectedBatchForSession] = useState<any | null>(null);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await adminGetCourseBatches();
      setBatches(data || []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách lớp học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const filteredBatches = batches.filter((batch) => {
    const isDemo = isDemoRecord(batch);
    if (statusFilter === "demo") return isDemo;
    if (isDemo) return false;
    if (statusFilter === "all") return true;
    const regStatus = (batch.registration_status || batch.status || "open").toLowerCase();
    return regStatus === statusFilter;
  });

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Lớp đào tạo</h1>
          <p className="text-sm text-slate-500 mt-1">Danh sách tất cả lớp học và trạng thái đăng ký học viên.</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20">
          <Link to="/admin/batches/new">
            <Plus className="mr-1.5 h-4 w-4" /> Tạo lớp mới
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-xs text-slate-700 shadow-2xs"
        >
          <option value="all">Tất cả trạng thái (Mở, nháp, đóng)</option>
          <option value="open">Đang mở đăng ký</option>
          <option value="draft">Bản nháp</option>
          <option value="closed">Đã đóng</option>
          <option value="demo">Dữ liệu test/smoke</option>
        </select>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-rose-50 text-rose-800 p-4 rounded-2xl border border-rose-200 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && filteredBatches.length === 0 && (
        <div className="text-center py-12 border border-slate-200 rounded-2xl bg-white text-slate-500 text-sm font-medium shadow-2xs">
          Chưa có lớp học nào trong mục này.
        </div>
      )}

      {!loading && !error && filteredBatches.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <table className="min-w-[1050px] w-full table-fixed text-xs text-left antialiased">
            <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-600 font-bold">
              <tr>
                <th className="w-[260px] px-4 py-3.5">Lớp / Batch</th>
                <th className="w-[220px] px-4 py-3.5">Khóa học</th>
                <th className="w-[120px] px-4 py-3.5">Giảng viên</th>
                <th className="w-[110px] px-4 py-3.5">Trạng thái</th>
                <th className="w-[110px] px-4 py-3.5">Buổi học</th>
                <th className="w-[90px] px-4 py-3.5">Số chỗ</th>
                <th className="w-[130px] px-4 py-3.5">Thời gian</th>
                <th className="w-[150px] px-4 py-3.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.map((batch) => {
                const regStatus = (batch.registration_status || batch.status || "open").toLowerCase();
                const instructorName = batch.instructor?.full_name || "Chưa gán";
                const sessionsCount = batch.sessions_count ?? (Array.isArray(batch.sessions) ? batch.sessions.length : 0);
                const rawCourseTitle = batch.course?.title || batch.course_title || batch.course_id || "";
                const courseTitleClean = rawCourseTitle.replace(/^\s*Chuyên\s+đề\s*:\s*/i, "");

                return (
                  <tr key={batch.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Cột 1: Lớp / Batch (w-[260px]) */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-semibold text-slate-900 leading-snug line-clamp-2">
                        {batch.title}
                        {isDemoRecord(batch) && (
                          <span className="inline-block bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ml-1.5 shrink-0">
                            Test
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{batch.slug}</div>
                    </td>

                    {/* Cột 2: Khóa học (w-[220px]) */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="text-slate-700 font-medium leading-snug line-clamp-2">
                        {courseTitleClean || "Chưa chọn khóa"}
                      </div>
                    </td>

                    {/* Cột 3: Giảng viên (w-[120px]) */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-semibold text-slate-700 truncate">{instructorName}</div>
                    </td>

                    {/* Cột 4: Trạng thái (w-[110px]) */}
                    <td className="px-4 py-3.5 align-top">
                      {regStatus === "open" && (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                          Mở đăng ký
                        </span>
                      )}
                      {regStatus === "closed" && (
                        <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 whitespace-nowrap">
                          Đã đóng
                        </span>
                      )}
                      {regStatus === "draft" && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 whitespace-nowrap">
                          Bản nháp
                        </span>
                      )}
                    </td>

                    {/* Cột 5: Buổi học (w-[110px]) */}
                    <td className="px-4 py-3.5 align-top">
                      {(() => {
                        const course = batch.course || batch.courses || {};
                        const catSlug = course.category_slug || course.category?.slug;
                        const isOneSession = isOneSessionCourseType(catSlug);

                        if (isOneSession) {
                          if (sessionsCount === 0) {
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 w-max">
                                  Thiếu buổi học
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">Lớp 1 buổi chưa tạo giờ</span>
                              </div>
                            );
                          } else if (sessionsCount === 1) {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-max">
                                Đủ lịch 1 buổi
                              </span>
                            );
                          } else {
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 w-max">
                                  Nhiều hơn 1 buổi
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">{sessionsCount} buổi</span>
                              </div>
                            );
                          }
                        } else {
                          // Multi-session or default
                          if (sessionsCount === 0) {
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 w-max">
                                  Thiếu lịch
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">Chưa có buổi học</span>
                              </div>
                            );
                          } else if (sessionsCount === 1) {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 w-max">
                                Mới có 1 buổi
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-max">
                                Đã có {sessionsCount} buổi
                              </span>
                            );
                          }
                        }
                      })()}
                    </td>

                    {/* Cột 6: Số chỗ (w-[90px]) */}
                    <td className="px-4 py-3.5 align-top text-slate-600 font-medium">
                      {batch.max_participants ? `${batch.max_participants} chỗ` : "Không hạn chế"}
                    </td>

                    {/* Cột 7: Thời gian (w-[130px]) */}
                    <td className="px-4 py-3.5 align-top text-slate-600 font-medium leading-relaxed">
                      {batch.start_date ? format(parseISO(batch.start_date), "dd/MM/yyyy") : "-"}
                      {batch.end_date ? ` – ${format(parseISO(batch.end_date), "dd/MM/yyyy")}` : ""}
                    </td>

                    {/* Cột 8: Thao tác (w-[150px]) */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex flex-col gap-1.5 min-w-[130px]">
                        <button
                          type="button"
                          onClick={() => setSelectedBatchForSession(batch)}
                          className={`inline-flex items-center justify-center gap-1 text-[11px] font-bold h-7.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                            sessionsCount === 0
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/50"
                              : "text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80"
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" /> Buổi
                        </button>
                        <div className="grid grid-cols-2 gap-1.5">
                          <Link 
                            to="/admin/batches/$batchId/registrations" 
                            params={{ batchId: batch.id }}
                            className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 h-7 px-1.5 rounded-lg transition-colors"
                          >
                            <Users className="h-3 w-3 text-slate-500 shrink-0" /> Leads
                          </Link>
                          <Link 
                            to="/admin/batches/$batchId" 
                            params={{ batchId: batch.id }}
                            search={{ addSession: false } as any}
                            className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-indigo-600 bg-white hover:bg-indigo-50 border border-indigo-200 h-7 px-1.5 rounded-lg transition-colors"
                          >
                            <Edit className="h-3 w-3 text-indigo-500 shrink-0" /> Sửa
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Session Modal */}
      <AddSessionModal
        isOpen={!!selectedBatchForSession}
        batch={selectedBatchForSession}
        onClose={() => setSelectedBatchForSession(null)}
        onSuccess={loadBatches}
      />
    </div>
  );
}

