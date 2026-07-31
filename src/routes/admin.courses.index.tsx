import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAcademyAdminCourses, useArchiveAcademyCourse } from "@/features/admin/hooks/useAcademyAdminCourses";
import type { AcademyCourseStatus } from "@/features/admin/types";
import { isDemoRecord } from "@/features/admin/utils/demoData";
import { getCourseTypeMeta } from "@/features/admin/constants";
import { Search, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/courses/")({
  component: AdminCourseList,
});

function AdminCourseList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AcademyCourseStatus | "all" | "demo">("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const archiveMutation = useArchiveAcademyCourse();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const {
    data: allCourses,
    isLoading,
    error,
    refetch,
  } = useAcademyAdminCourses({
    status: (statusFilter === "all" || statusFilter === "demo") ? undefined : statusFilter,
    search: debouncedSearch || undefined,
  });

  const courses = allCourses?.filter(course => {
    const isDemo = isDemoRecord(course);
    if (statusFilter === "demo") return isDemo;
    if (statusFilter === "all") return !isDemo;
    return !isDemo;
  });

  const handleArchiveDemo = async (courseId: string) => {
    if (window.confirm("Lưu trữ khóa học test/demo này?")) {
      await archiveMutation.mutateAsync(courseId);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Khóa học</h1>
          <p className="text-sm text-slate-500 mt-1">Danh sách khóa học, phân loại phễu và cấu hình khai giảng.</p>
        </div>
        <Link
          to="/admin/courses/new"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 text-sm"
        >
          <Plus size={16} />
          Tạo khóa học
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm khóa học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AcademyCourseStatus | "all" | "demo")}
          className="border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-xs text-slate-700"
        >
          <option value="all">Đang hoạt động</option>
          <option value="published">Công khai</option>
          <option value="draft">Bản nháp</option>
          <option value="archived">Đã lưu trữ</option>
          <option value="demo">Dữ liệu test/smoke</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl border"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-800 p-4 rounded-2xl border border-rose-200 flex flex-col items-center justify-center py-12">
          <p className="mb-4 text-sm font-medium">{(error as Error).message || "Không thể tải danh sách khóa học"}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700"
          >
            Thử lại
          </button>
        </div>
      ) : courses?.length === 0 ? (
        <div className="text-center py-16 border rounded-2xl bg-white text-slate-500 shadow-2xs">
          <h3 className="text-lg font-semibold mb-2 text-slate-900">Chưa có khóa học</h3>
          <p className="text-sm mb-4">
            {searchQuery || statusFilter !== "all"
              ? "Thử thay đổi từ khóa hoặc bộ lọc."
              : "Bắt đầu bằng cách tạo khóa học đầu tiên."}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Link
              to="/admin/courses/new"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700"
            >
              <Plus size={16} />
              Tạo khóa học
            </Link>
          )}
        </div>
      ) : (
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left antialiased">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-600 font-bold uppercase text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Tên khóa học</th>
                  <th className="px-6 py-3.5">Loại khóa học</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5">Hiển thị</th>
                  <th className="px-6 py-3.5">Cập nhật</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses?.map((course) => {
                  const typeMeta = getCourseTypeMeta(course.category_slug || course.category_name);
                  const badgeLabel = course.category_name || typeMeta?.name;

                  return (
                    <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 leading-snug flex items-center gap-2">
                          {course.title}
                          {isDemoRecord(course) && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                              Test
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{course.slug}</div>
                      </td>

                      {/* Cột Loại khóa học / Badge */}
                      <td className="px-6 py-4">
                        {badgeLabel ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              typeMeta?.badgeClass || "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {badgeLabel}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            course.status === "published"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : course.status === "draft"
                                ? "bg-slate-50 text-slate-600 border border-slate-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {{ published: "Công khai", draft: "Bản nháp", archived: "Lưu trữ" }[course.status] ?? course.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 capitalize text-slate-600 font-medium">{course.catalog_visibility}</td>

                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-medium">
                        {new Date(course.updated_at).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                        {course.slug && (
                          <Link
                            to="/khoa-hoc/$slug"
                            params={{ slug: course.slug }}
                            target="_blank"
                            className="text-xs font-semibold text-indigo-600 hover:underline mr-2"
                          >
                            Xem public ↗
                          </Link>
                        )}
                        <Link
                          to="/admin/batches/new"
                          search={{ course_id: course.id }}
                          className="text-emerald-700 hover:underline font-bold text-xs mr-2"
                        >
                          + Tạo lớp
                        </Link>
                        {isDemoRecord(course) && course.status !== "archived" && (
                          <button
                            onClick={() => handleArchiveDemo(course.id)}
                            className="text-rose-600 hover:underline font-semibold text-xs mr-2"
                            title="Lưu trữ dữ liệu test"
                          >
                            Lưu trữ
                          </button>
                        )}
                        <Link
                          to="/admin/courses/$courseId/settings"
                          params={{ courseId: course.id }}
                          className="text-indigo-600 hover:underline font-semibold text-xs"
                        >
                          {course.status === "archived" ? "Xem" : "Sửa"}
                        </Link>
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
  );
}

