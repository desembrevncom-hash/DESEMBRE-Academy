import { useEffect, useState, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAcademyAdminCourseEditor,
  useAcademyAdminCategories,
  useUpdateAcademyCourse,
  useAcademyCourseMarketingMetadata,
  useUpsertAcademyCourseMarketingMetadata,
} from "@/features/admin/hooks/useAcademyAdminCourses";
import { uploadCourseThumbnail } from "@/features/admin/services/academyAdminCoursesApi";
import { updateCourseSchema, type UpdateCourseFormData, marketingFormSchema } from "@/features/admin/validators";
import {
  CATALOG_VISIBILITY_OPTIONS,
  ENROLLMENT_POLICY_OPTIONS,
  ACCESS_POLICY_OPTIONS,
  PRICING_MODEL_OPTIONS,
} from "@/features/admin/constants";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCourseEditorRegistry } from "@/features/admin/contexts/CourseEditorRegistry";
import { ArrowLeft, Save, Undo2, Info, Upload, ImageIcon, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/courses/$courseId/settings")({
  component: CourseSettingsPage,
});

function CourseSettingsPage() {
  const { courseId } = Route.useParams();

  // Load editor data
  const { data: editorData, refetch: refetchEditorData } = useAcademyAdminCourseEditor(courseId);
  const { data: categories, isLoading: isLoadingCategories, isError: isErrorCategories } = useAcademyAdminCategories();
  const updateMutation = useUpdateAcademyCourse();
  const { setSettingsDirty, setActiveMutation, isReadOnly } = useCourseEditorRegistry();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateCourseFormData>({
    resolver: zodResolver(updateCourseSchema) as any,
  });

  const [restoring, setRestoring] = useState(false);
  const [savingCategoryOnly, setSavingCategoryOnly] = useState(false);
  const [archivedCategoryId, setArchivedCategoryId] = useState<string>("");

  // Hydrate the form when data is available
  useEffect(() => {
    if (editorData?.course) {
      const c = editorData.course;
      const catId = (c as any).category_id || c.category?.id || null;
      reset({
        title: c.title,
        slug: c.slug,
        description: c.description || "",
        category_id: catId,
        catalog_visibility: c.catalog_visibility,
        enrollment_policy: c.enrollment_policy,
        access_policy: c.access_policy,
        pricing_model: c.pricing_model,
        price_amount: (c as any).price_amount ?? 0,
        deposit_amount: (c as any).deposit_amount ?? null,
        price_currency: (c as any).price_currency || "VND",
        payment_note: (c as any).payment_note || "",
        cover_url: (c as any).cover_url || "",
        summary: (c as any).summary || "",
      });
      setArchivedCategoryId(catId || "");
    }
  }, [editorData, reset]);

  // Track dirty state and mutations in registry
  useEffect(() => {
    setSettingsDirty(isDirty);
  }, [isDirty, setSettingsDirty]);

  useEffect(() => {
    setActiveMutation(updateMutation.isPending || isSubmitting);
  }, [updateMutation.isPending, isSubmitting, setActiveMutation]);

  if (!editorData) {
    return null; // Handled by layout loading/error state
  }

  const { course } = editorData;

  const onSubmit = async (data: UpdateCourseFormData) => {
    try {
      await updateMutation.mutateAsync({
        p_course_id: course.id,
        p_title: data.title,
        p_slug: data.slug,
        p_description: data.description,
        p_category_id: data.category_id,
        p_catalog_visibility: data.catalog_visibility,
        p_enrollment_policy: data.enrollment_policy,
        p_access_policy: data.access_policy,
        p_pricing_model: data.pricing_model,
        cover_url: data.cover_url || null,
        summary: data.summary || null,
      });

      // Update price fields in DB directly
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        await supabase
          .from("courses")
          .update({
            pricing_model: data.pricing_model,
            price_amount: data.price_amount ?? 0,
            deposit_amount: data.deposit_amount ?? null,
            price_currency: data.price_currency || "VND",
            payment_note: data.payment_note || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", course.id);
      }

      toast.success("Đã lưu cài đặt khóa học thành công");
      refetchEditorData();
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      toast.error(
        typeof err.message === "string" ? err.message : "Cập nhật khóa học thất bại"
      );
    }
  };

  const handleRestoreCourse = async () => {
    const confirmRestore = window.confirm(
      "Khóa học đã lưu trữ sẽ được mở lại để chỉnh sửa. Không nên dùng cho khóa đã có dữ liệu lịch sử quan trọng. Bạn chắc chắn?"
    );
    if (!confirmRestore) return;

    try {
      setRestoring(true);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase client error");

      const { error: restoreErr } = await supabase
        .from("courses")
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .eq("id", courseId);

      if (restoreErr) throw restoreErr;

      toast.success("Đã khôi phục khóa học về dạng Bản nháp (Draft)!");
      refetchEditorData();
    } catch (err: any) {
      toast.error(err.message || "Không thể khôi phục khóa học");
    } finally {
      setRestoring(false);
    }
  };

  const handleSaveCategoryOnly = async () => {
    try {
      setSavingCategoryOnly(true);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase client error");

      const realCatId = archivedCategoryId && !archivedCategoryId.startsWith("predefined-") ? archivedCategoryId : null;

      const { error: catErr } = await supabase
        .from("courses")
        .update({ category_id: realCatId, updated_at: new Date().toISOString() })
        .eq("id", courseId);

      if (catErr) throw catErr;

      setValue("category_id", realCatId);
      toast.success("Đã lưu phân loại khóa học thành công!");
      await refetchEditorData();
    } catch (err: any) {
      toast.error(err.message || "Không thể cập nhật danh mục khóa học");
    } finally {
      setSavingCategoryOnly(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Đã xuất bản (Published)</span>;
      case "archived":
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">Đã lưu trữ (Archived)</span>;
      default:
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">Bản nháp (Draft)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg border shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">Cài đặt khóa học</h1>
            {getStatusBadge(course.status)}
          </div>
          <p className="text-muted-foreground">{course.title} ({course.slug})</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isReadOnly && (
            <Button
              type="button"
              onClick={handleRestoreCourse}
              disabled={restoring}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              {restoring ? "Đang khôi phục..." : "Khôi phục để chỉnh sửa"}
            </Button>
          )}
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
            <Link to="/admin/batches/new" search={{ course_id: course.id }}>
              + Tạo lớp cho khóa này
            </Link>
          </Button>
          {course.slug && (
            <Button asChild variant="outline" size="sm" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <Link to="/khoa-hoc/$slug" params={{ slug: course.slug }} target="_blank">
                Xem trang public ↗
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to={"/admin/courses" as any}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Trở về Tổng quan
            </Link>
          </Button>
        </div>
      </div>

      {isReadOnly && (
        <div className="bg-amber-50 text-amber-900 p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-sm">Khóa học này đã bị lưu trữ (Archived)</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Các thông tin cốt lõi (tên, slug, mô tả) bị khóa chỉnh sửa. Bạn vẫn có thể phân loại khóa học bên dưới hoặc khôi phục lại bản nháp để chỉnh sửa toàn bộ.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleRestoreCourse}
            disabled={restoring}
            className="bg-amber-700 hover:bg-amber-800 text-white font-bold shrink-0"
          >
            Khôi phục để chỉnh sửa
          </Button>
        </div>
      )}

      {/* Standalone Section for Category / Course Type (Always editable even when archived) */}
      <div className="bg-card text-card-foreground border rounded-2xl shadow-sm p-6 space-y-4 bg-indigo-50/30 border-indigo-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Phân loại khóa học (Course Type)</span>
              {isReadOnly && <span className="text-xs font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">(Có thể chỉnh sửa khi Archived)</span>}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Phân loại giúp định hình phễu đào tạo và hiển thị thông báo ZNS chính xác.</p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveCategoryOnly}
            disabled={savingCategoryOnly}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            {savingCategoryOnly ? "Đang lưu..." : "Lưu phân loại"}
          </Button>
        </div>

        <div className="max-w-md">
          <select
            value={archivedCategoryId}
            onChange={(e) => setArchivedCategoryId(e.target.value)}
            className="w-full border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          >
            <option value="">-- Chọn loại khóa học --</option>
            {(categories || []).map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 pb-20">
        
        {/* Thông tin cơ bản */}
        <div className="bg-card text-card-foreground border rounded-lg shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">Thông tin cơ bản</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Tên khóa học <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                {...register("title")}
                disabled={isReadOnly}
                placeholder="Ví dụ: Lập trình ReactJS Cơ bản"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium">
                Đường dẫn (Slug) <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center">
                <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-muted-foreground text-sm">
                  /courses/
                </span>
                <input
                  id="slug"
                  {...register("slug")}
                  disabled={isReadOnly}
                  placeholder="reactjs-co-ban"
                  className="w-full border rounded-r-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
                />
              </div>
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Mô tả ngắn
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={3}
              disabled={isReadOnly}
              placeholder="Viết một đoạn mô tả ngắn gọn để giới thiệu khóa học này..."
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-y disabled:opacity-50"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="summary" className="text-sm font-medium">
              Tóm tắt public (Landing Page Summary)
            </label>
            <textarea
              id="summary"
              {...register("summary")}
              rows={2}
              disabled={isReadOnly}
              placeholder="Tóm tắt nội dung khóa học hiển thị ngoài trang public /lich-khai-giang và /khoa-hoc/:slug..."
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-y disabled:opacity-50"
            />
            {errors.summary && (
              <p className="text-sm text-destructive">{errors.summary.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="cover_url" className="text-sm font-medium">
              Ảnh bìa public (Cover URL)
            </label>
            <input
              id="cover_url"
              {...register("cover_url")}
              disabled={isReadOnly}
              placeholder="https://domain.com/path/to/cover-image.jpg"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
            />
            {errors.cover_url && (
              <p className="text-sm text-destructive">{errors.cover_url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="category_id" className="text-sm font-medium">Danh mục (Category)</label>
            {isErrorCategories ? (
              <>
                <input
                  value={course.category?.name || "Chưa phân loại"}
                  disabled
                  className="w-full border rounded-md px-3 py-2 bg-muted text-muted-foreground"
                />
                <p className="text-xs text-yellow-600 mt-1">
                  Không tải được danh mục. Vui lòng thử lại.
                </p>
              </>
            ) : (
              <select
                id="category_id"
                {...register("category_id")}
                disabled={isReadOnly || isLoadingCategories}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
              >
                <option value="">-- Chưa phân loại --</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.slug})
                  </option>
                ))}
                {course.category && categories && !categories.some(c => c.id === course.category!.id) && (
                  <option value={course.category.id}>
                    {course.category.name} (Đã ẩn)
                  </option>
                )}
              </select>
            )}
            
            {course.category && categories && !categories.some(c => c.id === course.category!.id) && !isErrorCategories && (
              <p className="text-xs text-yellow-600 mt-1">
                Danh mục hiện tại không còn trong danh sách.
              </p>
            )}

            {errors.category_id && (
              <p className="text-sm text-destructive">{errors.category_id.message}</p>
            )}
          </div>
        </div>

        {/* Hiển thị catalog */}
        <div className="bg-card text-card-foreground border rounded-lg shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">Hiển thị Catalog</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="catalog_visibility" className="text-sm font-medium">
                Chế độ hiển thị
              </label>
              <select
                id="catalog_visibility"
                {...register("catalog_visibility")}
                disabled={isReadOnly}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
              >
                {CATALOG_VISIBILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.catalog_visibility && (
                <p className="text-sm text-destructive">{errors.catalog_visibility.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái khóa học</label>
              <div className="w-full border rounded-md px-3 py-2 bg-muted text-muted-foreground flex items-center justify-between">
                <span>{course.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                * Trạng thái được cập nhật thông qua nút Publish/Archive.
              </p>
            </div>
          </div>
        </div>

        {/* Enrollment & Access */}
        <div className="bg-card text-card-foreground border rounded-lg shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">Ghi danh & Truy cập (Enrollment & Access)</h2>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="enrollment_policy" className="text-sm font-medium">
                Quyền đăng ký (Enrollment Policy)
              </label>
              <select
                id="enrollment_policy"
                {...register("enrollment_policy")}
                disabled={isReadOnly}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
              >
                {ENROLLMENT_POLICY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.enrollment_policy && (
                <p className="text-sm text-destructive">{errors.enrollment_policy.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="access_policy" className="text-sm font-medium">
                Quyền truy cập nội dung (Access Policy)
              </label>
              <select
                id="access_policy"
                {...register("access_policy")}
                disabled={isReadOnly}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
              >
                {ACCESS_POLICY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.access_policy && (
                <p className="text-sm text-destructive">{errors.access_policy.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="pricing_model" className="text-sm font-medium">
                Mô hình giá (Pricing Model)
              </label>
              <select
                id="pricing_model"
                {...register("pricing_model")}
                disabled={isReadOnly}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
              >
                {PRICING_MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.pricing_model && (
                <p className="text-sm text-destructive">{errors.pricing_model.message}</p>
              )}
            </div>

            {/* Pricing details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <label htmlFor="price_amount" className="text-xs font-bold text-slate-700">
                  Học phí chính thức (VNĐ)
                </label>
                <input
                  id="price_amount"
                  type="number"
                  {...register("price_amount")}
                  disabled={isReadOnly}
                  placeholder="1500000"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="deposit_amount" className="text-xs font-bold text-slate-700">
                  Tiền đặt cọc giữ chỗ (VNĐ - N/A nếu 0)
                </label>
                <input
                  id="deposit_amount"
                  type="number"
                  {...register("deposit_amount")}
                  disabled={isReadOnly}
                  placeholder="500000"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="price_currency" className="text-xs font-bold text-slate-700">
                  Đơn vị tiền tệ
                </label>
                <input
                  id="price_currency"
                  type="text"
                  {...register("price_currency")}
                  disabled={isReadOnly}
                  placeholder="VND"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="payment_note" className="text-xs font-bold text-slate-700">
                Ghi chú thanh toán / Ưu đãi học phí
              </label>
              <input
                id="payment_note"
                type="text"
                {...register("payment_note")}
                disabled={isReadOnly}
                placeholder="e.g. Giảm 20% cho cựu học viên DESEMBRE..."
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Floating Actions */}
        {!isReadOnly && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t shadow-lg flex justify-end gap-4 z-50 md:pl-[260px]">
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty || isSubmitting || updateMutation.isPending}
              onClick={() => reset()}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Khôi phục gốc
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || isSubmitting || updateMutation.isPending}
              className="px-8 shadow-md"
            >
              {(isSubmitting || updateMutation.isPending) ? (
                <div className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></div>
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        )}
      </form>

      {/* Phân hệ Marketing Khóa học */}
      <MarketingSettings courseId={course.id} isReadOnly={isReadOnly} />
    </div>
  );
}

function MarketingSettings({ courseId, isReadOnly }: { courseId: string; isReadOnly: boolean }) {
  const { data: metadata, isLoading, isError } = useAcademyCourseMarketingMetadata(courseId);
  const upsertMutation = useUpsertAcademyCourseMarketingMetadata();
  const { setSettingsDirty, setActiveMutation } = useCourseEditorRegistry();
  const [isUploading, setIsUploading] = useState(false);
  const [showAdvancedThumb, setShowAdvancedThumb] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(marketingFormSchema) as any,
  });

  useEffect(() => {
    if (metadata) {
      reset({
        level: metadata.level || "",
        short_description: metadata.short_description || "",
        estimated_minutes: metadata.estimated_minutes || "",
        is_featured: metadata.is_featured || false,
        featured_order: metadata.featured_order || 0,
        audience_text: metadata.audience?.join('\n') || '',
        outcomes_text: metadata.outcomes?.join('\n') || '',
        thumbnail_url: metadata.thumbnail_url || "",
        thumbnail_alt: metadata.thumbnail_alt || "",
        seo_title: metadata.seo_title || "",
        seo_description: metadata.seo_description || "",
      });
    }
  }, [metadata, reset]);

  // We intentionally do not use setSettingsDirty or setActiveMutation here for the global floating bar
  // because this form has its own save button to keep things simple and avoid side-effects.

  const watchedThumbnailUrl = watch("thumbnail_url");
  const watchedSeoTitle = watch("seo_title");
  const watchedSeoDescription = watch("seo_description");
  const watchedShortDescription = watch("short_description");

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Dung lượng ảnh vượt quá 3MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsUploading(true);
      const publicUrl = await uploadCourseThumbnail(courseId, file);
      
      setValue("thumbnail_url", publicUrl, { shouldDirty: true });
      if (!watchedThumbnailUrl && !watchedSeoTitle) setValue("thumbnail_alt", file.name, { shouldDirty: true });
      
      toast.success("Tải ảnh lên thành công!");
    } catch (error: any) {
      toast.error(error.message || "Lỗi tải ảnh lên");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const audience = data.audience_text
        ? data.audience_text.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : [];
      const outcomes = data.outcomes_text
        ? data.outcomes_text.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : [];

      await upsertMutation.mutateAsync({
        p_course_id: courseId,
        p_level: data.level || null,
        p_short_description: data.short_description || null,
        p_estimated_minutes: data.estimated_minutes ? Number(data.estimated_minutes) : null,
        p_is_featured: !!data.is_featured,
        p_featured_order: data.featured_order ? Number(data.featured_order) : 0,
        p_audience: audience,
        p_outcomes: outcomes,
        p_thumbnail_url: data.thumbnail_url || null,
        p_thumbnail_alt: data.thumbnail_alt || null,
        p_seo_title: data.seo_title || null,
        p_seo_description: data.seo_description || null,
      });

      reset({}, { keepValues: true }); // Reset dirty state
      toast.success("Đã lưu Marketing khóa học thành công");
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      toast.error(
        typeof err.message === "string" ? err.message : "Cập nhật Marketing thất bại"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card text-card-foreground border rounded-lg shadow-sm p-6 space-y-6 animate-pulse">
        <h2 className="text-lg font-semibold border-b pb-2">Marketing khóa học</h2>
        <div className="h-40 bg-muted rounded-md"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-card text-card-foreground border rounded-lg shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">Marketing khóa học</h2>
        <p className="text-sm text-destructive">Không thể tải dữ liệu Marketing. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-card text-card-foreground border rounded-lg shadow-sm p-6 space-y-6 mt-6">
      <h2 className="text-lg font-semibold border-b pb-2">Marketing khóa học</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Cấp độ</label>
          <select
            {...register("level")}
            disabled={isReadOnly}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
          >
            <option value="">-- Chưa chọn --</option>
            <option value="basic">Cơ bản</option>
            <option value="intermediate">Trung cấp</option>
            <option value="advanced">Nâng cao</option>
          </select>
          {errors.level && <p className="text-sm text-destructive">{String(errors.level.message)}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Thời lượng ước tính (phút)</label>
          <input
            type="number"
            {...register("estimated_minutes", { valueAsNumber: true })}
            disabled={isReadOnly}
            placeholder="Ví dụ: 120"
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
          />
          {errors.estimated_minutes && <p className="text-sm text-destructive">{String(errors.estimated_minutes.message)}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Mô tả ngắn (Marketing)</label>
        <textarea
          {...register("short_description")}
          rows={3}
          disabled={isReadOnly}
          placeholder="Mô tả hấp dẫn để hiển thị trên thẻ khóa học..."
          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-y disabled:opacity-50"
        />
        {errors.short_description && <p className="text-sm text-destructive">{String(errors.short_description.message)}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Khóa nổi bật</label>
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="checkbox"
              id="is_featured"
              {...register("is_featured")}
              disabled={isReadOnly}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="is_featured" className="text-sm text-muted-foreground">Đánh dấu là nổi bật</label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Thứ tự nổi bật</label>
          <input
            type="number"
            {...register("featured_order", { valueAsNumber: true })}
            disabled={isReadOnly}
            placeholder="Ví dụ: 1"
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
          />
          {errors.featured_order && <p className="text-sm text-destructive">{String(errors.featured_order.message)}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Phù hợp với ai (Audience)</label>
        <p className="text-xs text-muted-foreground mb-1">Mỗi dòng là một ý.</p>
        <textarea
          {...register("audience_text")}
          rows={4}
          disabled={isReadOnly}
          placeholder="Sinh viên mới ra trường...&#10;Người chuyển trái ngành..."
          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-y disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Bạn sẽ học được gì (Outcomes)</label>
        <p className="text-xs text-muted-foreground mb-1">Mỗi dòng là một ý.</p>
        <textarea
          {...register("outcomes_text")}
          rows={4}
          disabled={isReadOnly}
          placeholder="Thành thạo ReactJS...&#10;Hiểu về State Management..."
          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-y disabled:opacity-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 pt-4 border-t">
        <h3 className="text-md font-semibold mb-2">SEO & Chia sẻ mạng xã hội</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">SEO Title</label>
              <input
                type="text"
                {...register("seo_title")}
                disabled={isReadOnly}
                placeholder="Tiêu đề hiển thị trên Google/Facebook..."
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">Tối đa 70 ký tự. Để trống sẽ dùng tên khóa học.</p>
              {errors.seo_title && <p className="text-sm text-destructive">{String(errors.seo_title.message)}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">SEO Description</label>
              <textarea
                {...register("seo_description")}
                rows={3}
                disabled={isReadOnly}
                placeholder="Mô tả hiển thị trên Google/Facebook..."
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-y disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">Tối đa 170 ký tự. Để trống sẽ dùng mô tả ngắn.</p>
              {errors.seo_description && <p className="text-sm text-destructive">{String(errors.seo_description.message)}</p>}
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium block">Ảnh bìa khóa học (Thumbnail)</label>
              
              <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={isReadOnly || isUploading}
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-sm">Đang tải ảnh lên...</span>
                  </div>
                ) : (
                  <>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isReadOnly}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Chọn ảnh tải lên
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center max-w-[200px] mt-1">
                      Hỗ trợ JPEG, PNG, WEBP. Tối đa 3MB.
                    </p>
                  </>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedThumb(!showAdvancedThumb)}
                  className="flex items-center text-sm text-primary font-medium hover:underline focus:outline-none"
                >
                  {showAdvancedThumb ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                  Nâng cao (Nhập URL thủ công)
                </button>
                
                {showAdvancedThumb && (
                  <div className="mt-4 p-4 border rounded-md bg-muted/30 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Thumbnail URL</label>
                      <input
                        type="text"
                        {...register("thumbnail_url")}
                        disabled={isReadOnly}
                        placeholder="https://example.com/image.jpg"
                        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
                      />
                      {errors.thumbnail_url && <p className="text-sm text-destructive">{String(errors.thumbnail_url.message)}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Thumbnail Alt Text</label>
                      <input
                        type="text"
                        {...register("thumbnail_alt")}
                        disabled={isReadOnly}
                        placeholder="Mô tả ảnh cho SEO..."
                        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
                      />
                      {errors.thumbnail_alt && <p className="text-sm text-destructive">{String(errors.thumbnail_alt.message)}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Preview (Xem trước)</label>
            <div className="border rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
              <div className="aspect-[1.91/1] bg-accent w-full overflow-hidden border-b">
                {watchedThumbnailUrl ? (
                  <img src={watchedThumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    Chưa có ảnh (Sẽ không hiển thị card khi share)
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col gap-1 bg-[#f0f2f5]">
                <div className="text-[12px] text-slate-500 uppercase">desembre.vn</div>
                <div className="font-bold text-[16px] text-[#1d2129] line-clamp-1">
                  {watchedSeoTitle || "Tên khóa học"}
                </div>
                <div className="text-[14px] text-[#606770] line-clamp-1">
                  {watchedSeoDescription || watchedShortDescription || "Mô tả khóa học..."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isReadOnly && (
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={!isDirty || isSubmitting || upsertMutation.isPending}
            className="px-6"
            variant="secondary"
          >
            {(isSubmitting || upsertMutation.isPending) ? (
              <div className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></div>
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Lưu Marketing
          </Button>
        </div>
      )}
    </form>
  );
}
