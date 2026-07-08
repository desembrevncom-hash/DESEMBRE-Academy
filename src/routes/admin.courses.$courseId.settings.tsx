import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAcademyAdminCourseEditor,
  useUpdateAcademyCourse,
} from "@/features/admin/hooks/useAcademyAdminCourses";
import { updateCourseSchema, type UpdateCourseFormData } from "@/features/admin/validators";
import { toast } from "sonner";
import { useCourseEditorRegistry } from "@/features/admin/contexts/CourseEditorRegistry";

export const Route = createFileRoute("/admin/courses/$courseId/settings")({
  component: CourseSettingsPage,
});

function CourseSettingsPage() {
  const { courseId } = Route.useParams();

  // We already fetch this in the layout, so it should hit the cache immediately
  const { data: editorData } = useAcademyAdminCourseEditor(courseId);
  const updateMutation = useUpdateAcademyCourse();
  const { setSettingsDirty, setActiveMutation, isReadOnly } = useCourseEditorRegistry();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateCourseFormData>({
    resolver: zodResolver(updateCourseSchema),
  });

  // Hydrate the form when data is available
  useEffect(() => {
    if (editorData?.course) {
      const c = editorData.course;
      reset({
        title: c.title,
        slug: c.slug,
        description: c.description || "",
        category_id: c.category?.id || null,
        catalog_visibility: c.catalog_visibility,
        enrollment_policy: c.enrollment_policy,
        access_policy: c.access_policy,
        pricing_model: c.pricing_model,
      });
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

  const onSubmit = async (data: UpdateCourseFormData) => {
    try {
      await updateMutation.mutateAsync({
        p_course_id: courseId,
        p_title: data.title,
        p_slug: data.slug,
        p_description: data.description,
        p_category_id: data.category_id,
        p_catalog_visibility: data.catalog_visibility,
        p_enrollment_policy: data.enrollment_policy,
        p_access_policy: data.access_policy,
        p_pricing_model: data.pricing_model,
      });

      toast.success("Course settings updated successfully");
      // React Query handles invalidation automatically through the hook
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      toast.error(
        typeof err.message === "string" ? err.message : "Failed to update course settings",
      );
    }
  };

  return (
    <div className="bg-card text-card-foreground border rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Course Metadata</h2>

      {isReadOnly && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md mb-6 border border-yellow-200">
          This course is archived. Changes are disabled.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            {...register("title")}
            disabled={isReadOnly}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
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
              disabled={isReadOnly}
              className="w-full border rounded-r-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
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
            disabled={isReadOnly}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-y disabled:opacity-50"
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
              disabled={isReadOnly}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
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
              disabled={isReadOnly}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
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
              disabled={isReadOnly}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
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
              disabled={isReadOnly}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
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

        {!isReadOnly && (
          <div className="pt-6 border-t flex justify-end">
            <button
              type="submit"
              disabled={!isDirty || isSubmitting || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(isSubmitting || updateMutation.isPending) && (
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></div>
              )}
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
