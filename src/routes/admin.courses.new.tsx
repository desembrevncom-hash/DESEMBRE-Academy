import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateAcademyCourse, useAcademyAdminCategories } from "@/features/admin/hooks/useAcademyAdminCourses";
import { createCourseSchema, type CreateCourseFormData } from "@/features/admin/validators";
import {
  CATALOG_VISIBILITY_OPTIONS,
  ENROLLMENT_POLICY_OPTIONS,
  ACCESS_POLICY_OPTIONS,
  PRICING_MODEL_OPTIONS,
  PREDEFINED_COURSE_TYPES,
  getCourseTypeMeta,
} from "@/features/admin/constants";
import { toast } from "sonner";
import { Info, Plus, Sparkles } from "lucide-react";

export const Route = createFileRoute("/admin/courses/new")({
  component: CreateCoursePage,
});

function CreateCoursePage() {
  const navigate = useNavigate();
  const createMutation = useCreateAcademyCourse();
  const { data: dbCategories = [], isLoading: isLoadingCategories } = useAcademyAdminCategories();
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
      category_id: "",
    },
  });

  const title = watch("title");
  const selectedCategoryId = watch("category_id");

  // Merge DB categories with Predefined Course Types to ensure options are always available
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
        description: pre.helperText,
        status: "published",
        course_count: 0,
      } as any);
    }
  });

  // Find active category meta for helper text
  const selectedCategoryObj = mergedCategories.find((c) => c.id === selectedCategoryId);
  const courseTypeMeta = selectedCategoryObj
    ? getCourseTypeMeta(selectedCategoryObj.slug) || getCourseTypeMeta(selectedCategoryObj.name)
    : null;

  // Auto-generate slug from title
  if (title && !hasManuallyEditedSlug) {
    const generatedSlug = title
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const currentSlug = watch("slug");
    if (currentSlug !== generatedSlug) {
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }

  const onSubmit: SubmitHandler<CreateCourseFormData> = async (data) => {
    try {
      // If user selected a synthetic predefined category ID that hasn't been saved to DB, pass null or original slug
      const realCategoryId = data.category_id && !data.category_id.startsWith("predefined-")
        ? data.category_id
        : undefined;

      const response = await createMutation.mutateAsync({
        p_title: data.title,
        p_slug: data.slug,
        p_description: data.description,
        p_category_id: realCategoryId,
        p_catalog_visibility: data.catalog_visibility,
        p_enrollment_policy: data.enrollment_policy,
        p_access_policy: data.access_policy,
        p_pricing_model: data.pricing_model,
      });

      toast.success("Tạo khóa học thành công!", {
        description: "Bấm bên dưới để tạo ngay Lớp khai giảng cho khóa học này.",
        action: {
          label: "+ Tạo lớp khai giảng",
          onClick: () => {
            navigate({
              to: "/admin/batches/new",
              search: { course_id: response.id } as any,
            });
          },
        },
      });

      // Navigate to settings page with the returned ID and course_id parameter for quick batch creation
      navigate({
        to: "/admin/courses/$courseId/settings",
        params: { courseId: response.id },
      });
    } catch (error: unknown) {
      console.error("[Create Course Error Detail]", error);
      const err = error as Record<string, unknown>;
      const msg = typeof err.message === "string" ? err.message : "";
      
      if (
        msg.includes("courses_catalog_visibility_check") ||
        msg.includes("courses_access_policy_check") ||
        msg.includes("check constraint") ||
        msg.includes("violates check constraint")
      ) {
        toast.error("Không thể tạo khóa học. Vui lòng kiểm tra cấu hình hiển thị, đăng ký và quyền truy cập.");
      } else if (err.code === "DUPLICATE_SLUG" || msg.includes("duplicate key") || msg.includes("already exists")) {
        toast.error("Đường dẫn (slug) này đã tồn tại, vui lòng chọn đường dẫn khác.");
      } else {
        toast.error("Không thể tạo khóa học. Vui lòng kiểm tra cấu hình hiển thị, đăng ký và quyền truy cập.");
      }
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl px-4">
      <div className="mb-8">
        <Link
          to="/admin/courses"
          className="text-indigo-600 hover:underline text-sm mb-4 inline-block font-medium"
        >
          &larr; Quay lại danh sách khóa học
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Tạo khóa học mới</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Nhập thông tin cơ bản và chọn loại khóa học phù hợp (buổi phễu, chuyên đề, workshop,...).
        </p>
      </div>

      <div className="bg-card text-card-foreground border rounded-2xl shadow-sm p-6 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 1. Category / Course Type Selection */}
          <div className="space-y-2.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
            <label htmlFor="category_id" className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Loại khóa học / Danh mục</span>
              <span className="text-xs font-normal text-slate-500">(Khuyến nghị chọn đúng để hỗ trợ quy trình phễu)</span>
            </label>
            <select
              id="category_id"
              {...register("category_id")}
              className="w-full border rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-800 bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              disabled={isLoadingCategories}
            >
              <option value="">-- Chọn loại khóa học --</option>
              {mergedCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}

            {/* Helper Text Card based on Selected Category */}
            {courseTypeMeta && (
              <div className="mt-2.5 p-3 rounded-xl bg-indigo-50/90 border border-indigo-100 text-indigo-900 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-indigo-950">{courseTypeMeta.name}</p>
                  <p className="leading-relaxed text-indigo-800">{courseTypeMeta.helperText}</p>
                </div>
              </div>
            )}
          </div>

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
              <label htmlFor="enrollment_policy" className="text-sm font-medium">
                Chính sách đăng ký
              </label>
              <select
                id="enrollment_policy"
                {...register("enrollment_policy")}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
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
                Quyền truy cập
              </label>
              <select
                id="access_policy"
                {...register("access_policy")}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
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
                Hình thức tính phí
              </label>
              <select
                id="pricing_model"
                {...register("pricing_model")}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
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
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-indigo-600/20"
            >
              {(isSubmitting || createMutation.isPending) && (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              )}
              <span>Tạo khóa học nháp</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


