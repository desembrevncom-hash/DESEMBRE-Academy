import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAcademyAdminCourses, useArchiveAcademyCourse, useAcademyAdminCategories, academyAdminKeys } from "@/features/admin/hooks/useAcademyAdminCourses";
import { academyAdminCoursesApi } from "@/features/admin/services/academyAdminCoursesApi";
import type { AcademyCourseStatus } from "@/features/admin/types";
import { isDemoRecord } from "@/features/admin/utils/demoData";
import { PREDEFINED_COURSE_TYPES, getCourseTypeMeta, resolveCourseType } from "@/features/admin/constants";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/courses/")({
  component: AdminCourseList,
});

function AdminCourseList() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AcademyCourseStatus | "all" | "demo">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [updatingCourseId, setUpdatingCourseId] = useState<string | null>(null);

  const archiveMutation = useArchiveAcademyCourse();
  const { data: dbCategories = [], refetch: refetchCategories } = useAcademyAdminCategories();

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

  // Combine categories for selection
  const mergedCategories = [...dbCategories];
  PREDEFINED_COURSE_TYPES.forEach((pre) => {
    const exists = mergedCategories.some(
      (c) => c.slug === pre.slug || c.name.toLowerCase() === pre.name.toLowerCase()
    );
    if (!exists) {
      mergedCategories.push({
        id: `predefined-${pre.slug}`,
        name: pre.name,
        slug: pre.slug,
      } as any);
    }
  });

  const courses = allCourses?.filter(course => {
    const isDemo = isDemoRecord(course);
    if (statusFilter === "demo") {
      if (!isDemo) return false;
    } else if (statusFilter === "all") {
      if (isDemo) return false;
    } else {
      if (isDemo) return false;
    }

    if (categoryFilter !== "all") {
      const resolved = resolveCourseType(course.category_id, dbCategories);
      if (categoryFilter === "uncategorized") {
        if (!resolved.isUncategorized) return false;
      } else {
        const matchesSlug = resolved.category?.slug === categoryFilter;
        const matchesMeta = resolved.typeMeta?.slug === categoryFilter;
        if (!matchesSlug && !matchesMeta) return false;
      }
    }
    return true;
  });

  const handleArchiveDemo = async (courseId: string) => {
    if (window.confirm("Lưu trữ khóa học test/demo này?")) {
      await archiveMutation.mutateAsync(courseId);
    }
  };

  const handleQuickCategoryChange = async (courseId: string, selectedVal: string) => {
    try {
      setUpdatingCourseId(courseId);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase client error");

      let targetCatId: string | null = null;

      if (!selectedVal || selectedVal === "uncategorized") {
        targetCatId = null;
      } else if (!selectedVal.startsWith("predefined-")) {
        targetCatId = selectedVal;
      } else {
        const preSlug = selectedVal.replace("predefined-", "");
        const preMeta = PREDEFINED_COURSE_TYPES.find((p) => p.slug === preSlug);
        
        // 1. Check if category exists in dbCategories
        const existingCat = dbCategories.find(
          (c) => c.slug === preSlug || (preMeta && c.name.toLowerCase() === preMeta.name.toLowerCase())
        );

        if (existingCat) {
          targetCatId = existingCat.id;
        } else {
          // 2. Create category in DB if not found
          const catName = preMeta?.name || preSlug;
          try {
            const created = await academyAdminCoursesApi.createCategory({
              p_name: catName,
              p_slug: preSlug,
              p_status: "published",
            });
            if (created?.id) {
              targetCatId = created.id;
            }
          } catch (createErr) {
            console.warn("Could not create category via RPC, searching DB table directly", createErr);
            const { data: catRow } = await supabase
              .from("course_categories")
              .select("id")
              .or(`slug.eq.${preSlug},name.ilike.%${catName}%`)
              .maybeSingle();

            if (catRow?.id) {
              targetCatId = catRow.id;
            }
          }
        }
      }

      console.log("[CourseType] updating", { courseId, selectedCategoryId: targetCatId });

      // Update public.courses category_id and verify returned row
      const { data: updatedRows, error: updateErr } = await supabase
        .from("courses")
        .update({
          category_id: targetCatId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", courseId)
        .select("id, category_id");

      if (updateErr) throw updateErr;

      console.log("[CourseType] updated row", updatedRows);

      if (!updatedRows || updatedRows.length === 0) {
        throw new Error("CATEGORY_UPDATE_NO_ROWS_AFFECTED");
      }

      const updatedRow = updatedRows[0];
      if (updatedRow.category_id !== targetCatId) {
        throw new Error(`CATEGORY_UPDATE_NOT_PERSISTED: Expected ${targetCatId}, got ${updatedRow.category_id}`);
      }

      toast.success("Cập nhật loại khóa học thành công!");
      await refetchCategories();
      queryClient.invalidateQueries({ queryKey: [...academyAdminKeys.all] });
      await refetch();
    } catch (err: any) {
      console.error("[Quick Category Error]", err);
      toast.error(err.message || "Không thể cập nhật loại khóa học");
    } finally {
      setUpdatingCourseId(null);
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

      <div className="flex flex-col md:flex-row gap-4 mb-6">
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
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-xs text-slate-700"
        >
          <option value="all">Tất cả loại khóa học</option>
          {PREDEFINED_COURSE_TYPES.map((type) => (
            <option key={type.slug} value={type.slug}>
              {type.name}
            </option>
          ))}
          <option value="uncategorized">Chưa phân loại</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AcademyCourseStatus | "all" | "demo")}
          className="border rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-xs text-slate-700"
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
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "Thử thay đổi từ khóa hoặc bộ lọc."
              : "Bắt đầu bằng cách tạo khóa học đầu tiên."}
          </p>
          {!searchQuery && statusFilter === "all" && categoryFilter === "all" && (
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
            <table className="w-full min-w-[980px] text-xs text-left antialiased">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 w-[280px]">Tên khóa học</th>
                  <th className="px-5 py-3.5 w-[220px]">Loại khóa học</th>
                  <th className="px-5 py-3.5 w-[110px]">Trạng thái</th>
                  <th className="px-5 py-3.5 w-[90px]">Hiển thị</th>
                  <th className="px-5 py-3.5 w-[100px]">Cập nhật</th>
                  <th className="px-5 py-3.5 w-[180px] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses?.map((course) => {
                  const resolved = resolveCourseType(course.category_id, dbCategories);

                  return (
                    <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Cột Tên khóa học (w-[280px]) */}
                      <td className="px-5 py-4 align-top w-[280px]">
                        <div className="font-semibold text-slate-900 leading-snug flex items-center gap-2 line-clamp-2">
                          {course.title}
                          {isDemoRecord(course) && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                              Test
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[240px]" title={course.slug}>
                          {course.slug}
                        </div>
                      </td>

                      {/* Cột Loại khóa học (w-[220px]) */}
                      <td className="px-5 py-4 align-top w-[220px]">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${resolved.badgeClass}`}
                          >
                            {resolved.label}
                          </span>
                          
                          {/* Compact Quick Change Select */}
                          <select
                            value={course.category_id || ""}
                            onChange={(e) => handleQuickCategoryChange(course.id, e.target.value)}
                            disabled={updatingCourseId === course.id}
                            className="text-[10px] bg-white text-slate-700 font-semibold border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer w-[140px]"
                            title="Đổi loại khóa học"
                          >
                            <option value="">-- Đổi loại --</option>
                            {mergedCategories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Cột Trạng thái (w-[110px]) */}
                      <td className="px-5 py-4 align-top w-[110px]">
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

                      {/* Cột Hiển thị (w-[90px]) */}
                      <td className="px-5 py-4 align-top capitalize text-slate-600 font-medium w-[90px]">
                        {course.catalog_visibility}
                      </td>

                      {/* Cột Cập nhật (w-[100px]) */}
                      <td className="px-5 py-4 align-top text-slate-500 whitespace-nowrap font-medium w-[100px]">
                        {new Date(course.updated_at).toLocaleDateString()}
                      </td>

                      {/* Cột Thao tác (w-[180px]) */}
                      <td className="px-5 py-4 align-top text-right whitespace-nowrap w-[180px]">
                        <div className="flex items-center justify-end gap-2 text-xs font-semibold">
                          {course.slug && (
                            <Link
                              to="/khoa-hoc/$slug"
                              params={{ slug: course.slug }}
                              target="_blank"
                              className="text-indigo-600 hover:text-indigo-800 transition-colors"
                              title="Xem trang public"
                            >
                              Xem ↗
                            </Link>
                          )}
                          <Link
                            to="/admin/batches/new"
                            search={{ course_id: course.id }}
                            className="text-emerald-700 hover:text-emerald-800 font-bold transition-colors"
                          >
                            + Tạo lớp
                          </Link>
                          {isDemoRecord(course) && course.status !== "archived" && (
                            <button
                              onClick={() => handleArchiveDemo(course.id)}
                              className="text-rose-600 hover:text-rose-800 font-semibold transition-colors"
                              title="Lưu trữ dữ liệu test"
                            >
                              Lưu trữ
                            </button>
                          )}
                          <Link
                            to="/admin/courses/$courseId/settings"
                            params={{ courseId: course.id }}
                            className="text-slate-700 hover:text-indigo-600 font-bold transition-colors"
                          >
                            {course.status === "archived" ? "Xem" : "Sửa"}
                          </Link>
                        </div>
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


