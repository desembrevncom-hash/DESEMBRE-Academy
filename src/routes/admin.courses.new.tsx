import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
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
    resolver: zodResolver(createCourseSchema),
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

  const onSubmit = async (data: CreateCourseFormData) => {
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

      toast.success("Course created successfully!");

      // Navigate to settings page with the returned ID
      navigate({
        to: "/admin/courses/$courseId/settings",
        params: { courseId: response.id },
      });
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      const msg = typeof err.message === 'string' ? err.message : "Failed to create course";
      toast.error(msg);
      // Duplicate slug error handled specifically
      if (err.code === "DUPLICATE_SLUG") {
        // Can set specific field error, but toast is sufficient for now
      }
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl px-4">
      <div className="mb-8">
        <Link
          to="/admin/courses"
          className="text-primary hover:underline text-sm mb-4 inline-block"
        >
          &larr; Back to Courses
        </Link>
        <h1 className="text-3xl font-bold">Create New Course</h1>
        <p className="text-muted-foreground mt-2">
          Start by filling out the core details of your new course. It will be saved as a draft.
        </p>
      </div>

      <div className="bg-card text-card-foreground border rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              {...register("title")}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="e.g. Advanced TypeScript"
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="text-sm font-medium">
              Slug <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center">
              <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-muted-foreground text-sm">
                /courses/
              </span>
              <input
                id="slug"
                {...register("slug")}
                onInput={() => setHasManuallyEditedSlug(true)}
                className="w-full border rounded-r-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="advanced-typescript"
              />
            </div>
            {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={4}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-y"
              placeholder="A brief summary of what this course covers..."
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="catalog_visibility" className="text-sm font-medium">
                Visibility
              </label>
              <select
                id="catalog_visibility"
                {...register("catalog_visibility")}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
                <option value="private">Private (Hidden from catalog)</option>
                <option value="unlisted">Unlisted (Direct link only)</option>
                <option value="public">Public (Visible in catalog)</option>
              </select>
              {errors.catalog_visibility && (
                <p className="text-sm text-destructive">{errors.catalog_visibility.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="enrollment_policy" className="text-sm font-medium">
                Enrollment Policy
              </label>
              <select
                id="enrollment_policy"
                {...register("enrollment_policy")}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
                <option value="closed">Closed (Admin invites only)</option>
                <option value="approval_required">Approval Required</option>
                <option value="open">Open (Self-enrollment)</option>
              </select>
              {errors.enrollment_policy && (
                <p className="text-sm text-destructive">{errors.enrollment_policy.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="access_policy" className="text-sm font-medium">
                Access Policy
              </label>
              <select
                id="access_policy"
                {...register("access_policy")}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
                <option value="dynamic">Dynamic (Based on user role/entitlements)</option>
                <option value="free">Free (Open to all enrolled)</option>
                <option value="paid">Paid (Requires purchase)</option>
              </select>
              {errors.access_policy && (
                <p className="text-sm text-destructive">{errors.access_policy.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="pricing_model" className="text-sm font-medium">
                Pricing Model
              </label>
              <select
                id="pricing_model"
                {...register("pricing_model")}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
                <option value="included">Included (in subscription/membership)</option>
                <option value="free">Free</option>
                <option value="one_time">One-time payment</option>
                <option value="subscription">Subscription</option>
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
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(isSubmitting || createMutation.isPending) && (
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></div>
              )}
              Create Draft Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
