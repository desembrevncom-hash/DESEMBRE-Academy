import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateAcademyCourse } from "@/features/admin/hooks/useAcademyAdminCourses";
import { createCourseSchema, type CreateCourseFormData } from "@/features/admin/validators";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/courses/new")({
  component: CreateCoursePage,
});

function CreateCoursePage() {
  const navigate = useNavigate();
  const createMutation = useCreateAcademyCourse();
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCourseFormData>({
    resolver: zodResolver(createCourseSchema) as unknown as Resolver<CreateCourseFormData>,
    defaultValues: {
      catalog_visibility: "private",
      enrollment_policy: "closed",
      access_policy: "dynamic",
      pricing_model: "included",
      title: "",
      slug: "",
      description: "",
    },
  });

  const title = watch("title");

  // Auto-generate slug from title
  if (title && !hasManuallyEditedSlug) {
    const generatedSlug = title
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Only update if it's different to avoid infinite loops, though react-hook-form handles it gracefully
    const currentSlug = watch("slug");
    if (currentSlug !== generatedSlug) {
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }

  const onSubmit: SubmitHandler<CreateCourseFormData> = async (data) => {
    try {
      const response = await createMutation.mutateAsync({
        p_title: data.title,
        p_slug: data.slug,
        p_description: data.description,
        p_category_id: data.category_id,
        p_catalog_visibility: data.catalog_visibility,
        p_enrollment_policy: data.enrollment_policy,
        p_access_policy: data.access_policy,
        p_pricing_model: data.pricing_model,
      });

      toast.success("Tạo khóa học thành công!");

      // Navigate to settings page with the returned ID
      navigate({
        to: "/admin/courses/$courseId/settings",
        params: { courseId: response.id },
      });
    } catch (error: unknown) {
      console.error("[Create Course Error Detail]:", error);
      const err = error as Record<string, unknown>;
      const msg = typeof err.message === "string" ? err.message : "";
      
      if (
        msg.includes("courses_access_policy_check") ||
        msg.includes("check constraint") ||
        msg.includes("violates check constraint")
      ) {
        toast.error("Không thể tạo khóa học. Một trường cấu hình chưa đúng với quy định dữ liệu.");
      } else if (err.code === "DUPLICATE_SLUG" || msg.includes("duplicate key") || msg.includes("already exists")) {
        toast.error("Đường dẫn (slug) này đã tồn tại, vui lòng chọn đường dẫn khác.");
      } else {
        toast.error("Không thể tạo khóa học. Một trường cấu hình chưa đúng với quy định dữ liệu.");
      }
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl px-4">
      <div className="mb-8">
        <Link
          to="/admin/courses"
          className="text-primary hover:underline text-sm mb-4 inline-block font-medium"
        >
          &larr; Quay lại danh sách khóa học
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Tạo khóa học mới</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Nhập thông tin cơ bản. Khóa học sẽ được lưu dưới dạng bản nháp.
        </p>
      </div>

      <div className="bg-card text-card-foreground border rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Tên khóa học <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              {...register("title")}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="Ví dụ: Chuyên đề SYNERGISTIC PROTOCOL"
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="text-sm font-medium">
              Đường dẫn <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center">
              <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-muted-foreground text-sm">
                /khoa-hoc/
              </span>
              <input
                id="slug"
                {...register("slug")}
                onInput={() => setHasManuallyEditedSlug(true)}
                className="w-full border rounded-r-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="chuyen-de-synergistic-protocol"
              />
            </div>
            {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Mô tả
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={4}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-y"
              placeholder="Tóm tắt ngắn gọn nội dung khóa học..."
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="catalog_visibility" className="text-sm font-medium">
                Hiển thị
              </label>
              <select
                id="catalog_visibility"
                {...register("catalog_visibility")}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
                <option value="private">Riêng tư (Ẩn khỏi danh mục)</option>
                <option value="unlisted">Không công khai (Chỉ mở qua link direct)</option>
                <option value="public">Công khai (Hiển thị trong danh mục)</option>
              </select>
              {errors.catalog_visibility && (
                <p className="text-sm text-destructive">{errors.catalog_visibility.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="enrollment_policy" className="text-sm font-medium">
                Chính sách đăng ký
              </label>
              <select
                id="enrollment_policy"
                {...register("enrollment_policy")}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
                <option value="closed">Đóng (Quản trị viên mời/gán lớp)</option>
                <option value="approval_required">Cần xét duyệt (Đăng ký chờ Admin duyệt)</option>
                <option value="open">Mở (Tự do đăng ký)</option>
              </select>
              {errors.enrollment_policy && (
                <p className="text-sm text-destructive">{errors.enrollment_policy.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="access_policy" className="text-sm font-medium">
                Quyền truy cập
              </label>
              <select
                id="access_policy"
                {...register("access_policy")}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
                <option value="dynamic">Động (Dynamic - Theo vai trò & quyền hạn)</option>
                <option value="grandfathered">Đã cấp quyền trước đây (Grandfathered)</option>
              </select>
              {errors.access_policy && (
                <p className="text-sm text-destructive">{errors.access_policy.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="pricing_model" className="text-sm font-medium">
                Hình thức tính phí
              </label>
              <select
                id="pricing_model"
                {...register("pricing_model")}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
                <option value="included">Đã bao gồm (Included in tier/sub)</option>
                <option value="free">Miễn phí (Free)</option>
                <option value="paid">Trả phí (Paid)</option>
              </select>
              {errors.pricing_model && (
                <p className="text-sm text-destructive">{errors.pricing_model.message}</p>
              )}
            </div>
          </div>

          <div className="pt-6 border-t flex justify-end gap-4">
            <Link
              to="/admin/courses"
              className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(isSubmitting || createMutation.isPending) && (
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></div>
              )}
              Tạo khóa học nháp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
