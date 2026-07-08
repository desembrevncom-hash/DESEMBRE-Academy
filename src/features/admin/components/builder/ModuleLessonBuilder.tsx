import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";
import {
  useAcademyAdminCourseEditor,
  useCreateAcademyModule,
} from "../../hooks/useAcademyAdminCourses";
import { moduleSchema, type ModuleFormData } from "../../validators";
import { ModuleCard } from "./ModuleCard";

export function ModuleLessonBuilder({ courseId }: { courseId: string }) {
  const { data, isLoading, isError, error, refetch } = useAcademyAdminCourseEditor(courseId);
  const createModule = useCreateAcademyModule();
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema) as unknown as Resolver<ModuleFormData>,
  });

  const onSubmit = async (formData: ModuleFormData) => {
    try {
      await createModule.mutateAsync({
        p_course_id: courseId,
        p_title: formData.title,
      });
      toast.success("Module created successfully");
      setIsCreating(false);
      reset();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create module");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading course data...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 text-center text-destructive">
        <p className="mb-4">
          {error instanceof Error ? error.message : "Failed to load course data."}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  const { course, modules } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Course Content</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage modules and lessons for <strong>{course.title}</strong>
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div>Modules: {modules.length}</div>
          <div>Lessons: {modules.reduce((acc, m) => acc + m.lessons.length, 0)}</div>
        </div>
      </div>

      <div className="space-y-4">
        {modules.length === 0 ? (
          <div className="text-center p-12 border rounded-lg border-dashed bg-muted/20">
            <h3 className="font-semibold text-lg">No modules yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">
              Get started by creating your first module.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((mod, index) => (
              <ModuleCard
                key={mod.id}
                courseId={courseId}
                moduleData={mod}
                isFirst={index === 0}
                isLast={index === modules.length - 1}
                allModuleIds={modules.map((m) => m.id)}
              />
            ))}
          </div>
        )}

        {isCreating ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-4 border rounded-lg bg-card space-y-4"
          >
            <div>
              <label htmlFor="title" className="text-sm font-medium">
                Module Title
              </label>
              <input
                id="title"
                autoFocus
                {...register("title")}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-background"
                placeholder="e.g. Introduction to the Course"
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  reset();
                }}
                className="px-3 py-1.5 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Save Module"}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 p-4 border rounded-lg border-dashed text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add New Module
          </button>
        )}
      </div>
    </div>
  );
}
