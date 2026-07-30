import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAcademyAdminCourses, useArchiveAcademyCourse } from "@/features/admin/hooks/useAcademyAdminCourses";
import type { AcademyCourseStatus } from "@/features/admin/types";
import { isDemoRecord } from "@/features/admin/utils/demoData";
import { Search, Plus, Archive } from "lucide-react";

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
    <div className="container mx-auto py-8 max-w-5xl px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Khóa học</h1>
        <Link
          to="/admin/courses/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
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
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AcademyCourseStatus | "all" | "demo")}
          className="border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
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
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg border"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex flex-col items-center justify-center py-12">
          <p className="mb-4">{(error as Error).message || "Không thể tải danh sách khóa học"}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
          >
            Thử lại
          </button>
        </div>
      ) : courses?.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-card text-card-foreground shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Chưa có khóa học</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== "all"
              ? "Thử thay đổi từ khóa hoặc bộ lọc."
              : "Bắt đầu bằng cách tạo khóa học đầu tiên."}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Link
              to="/admin/courses/new"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              <Plus size={16} />
              Tạo khóa học
            </Link>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card text-card-foreground shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Tên khóa học</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Hiển thị</th>
                  <th className="px-6 py-3">Cập nhật</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {courses?.map((course) => (
                  <tr key={course.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        {course.title}
                        {isDemoRecord(course) && (
                          <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                            Dữ liệu test
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{course.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          course.status === "published"
                            ? "bg-green-100 text-green-800"
                            : course.status === "draft"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {{ published: "Công khai", draft: "Bản nháp", archived: "Lưu trữ" }[course.status] ?? course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize">{course.catalog_visibility}</td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {new Date(course.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      {course.slug && (
                        <Link
                          to="/khoa-hoc/$slug"
                          params={{ slug: course.slug }}
                          target="_blank"
                          className="text-xs font-semibold text-indigo-600 hover:underline mr-3"
                        >
                          Xem public ↗
                        </Link>
                      )}
                      <Link
                        to="/admin/batches/new"
                        search={{ course_id: course.id }}
                        className="text-emerald-600 hover:underline font-medium mr-3 text-xs"
                      >
                        + Tạo lớp
                      </Link>
                      {isDemoRecord(course) && course.status !== "archived" && (
                        <button
                          onClick={() => handleArchiveDemo(course.id)}
                          className="text-rose-600 hover:underline font-medium mr-3 text-xs"
                          title="Lưu trữ dữ liệu test"
                        >
                          Lưu trữ
                        </button>
                      )}
                      <Link
                        to="/admin/courses/$courseId/settings"
                        params={{ courseId: course.id }}
                        className="text-primary hover:underline font-medium text-xs"
                      >
                        {course.status === "archived" ? "Xem" : "Sửa"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
