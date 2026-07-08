import React, { useState } from "react";
import { ChevronDown, ChevronUp, Edit2, Plus, GripVertical } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";
import {
  useUpdateAcademyModule,
  useReorderAcademyModules,
  useCreateAcademyLesson,
} from "../../hooks/useAcademyAdminCourses";
import {
  moduleSchema,
  lessonSchema,
  type ModuleFormData,
  type LessonFormData,
} from "../../validators";
import type { AcademyAdminModule } from "../../types";
import { LessonCard } from "./LessonCard";
import { useCourseEditorRegistry } from "../../contexts/CourseEditorRegistry";

interface ModuleCardProps {
  courseId: string;
  moduleData: AcademyAdminModule;
  isFirst: boolean;
  isLast: boolean;
  allModuleIds: string[];
}

export function ModuleCard({
  courseId,
  moduleData,
  isFirst,
  isLast,
  allModuleIds,
}: ModuleCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const { isReadOnly } = useCourseEditorRegistry();

  const updateModule = useUpdateAcademyModule(courseId);
  const reorderModules = useReorderAcademyModules();
  const createLesson = useCreateAcademyLesson(courseId);

  const {
    register: editReg,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors, isSubmitting: isEditSubmitting },
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema) as unknown as Resolver<ModuleFormData>,
    defaultValues: { title: moduleData.title },
  });

  const {
    register: addReg,
    handleSubmit: handleAddSubmit,
    reset: resetAdd,
    formState: { errors: addErrors, isSubmitting: isAddSubmitting },
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema) as unknown as Resolver<LessonFormData>,
    defaultValues: { type: "video", is_preview: false },
  });

  const onEdit = async (data: ModuleFormData) => {
    try {
      await updateModule.mutateAsync({
        p_module_id: moduleData.id,
        p_title: data.title,
      });
      toast.success("Module updated");
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update module");
    }
  };

  const onAddLesson = async (data: LessonFormData) => {
    try {
      await createLesson.mutateAsync({
        p_module_id: moduleData.id,
        p_title: data.title,
        p_type: data.type,
        p_description: data.description || null,
        p_is_preview: data.is_preview,
      });
      toast.success("Lesson created");
      setIsAddingLesson(false);
      resetAdd();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create lesson");
    }
  };

  const handleReorder = async (direction: "up" | "down") => {
    if (reorderModules.isPending) return;

    const currentIndex = allModuleIds.indexOf(moduleData.id);
    if (currentIndex === -1) return;
    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === allModuleIds.length - 1) return;

    const newOrder = [...allModuleIds];
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    [newOrder[currentIndex], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[currentIndex]];

    try {
      await reorderModules.mutateAsync({
        p_course_id: courseId,
        p_module_ids: newOrder,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reorder modules");
    }
  };

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <div className="bg-muted/30 p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex flex-col gap-1 items-center justify-center p-1 bg-muted rounded text-muted-foreground">
            <button
              onClick={() => handleReorder("up")}
              disabled={isFirst || reorderModules.isPending || isReadOnly}
              className="hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
              aria-label="Move module up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleReorder("down")}
              disabled={isLast || reorderModules.isPending || isReadOnly}
              className="hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
              aria-label="Move module down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <form onSubmit={handleEditSubmit(onEdit)} className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    {...editReg("title")}
                    autoFocus
                    className="w-full border rounded px-2 py-1 text-sm bg-background"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isEditSubmitting}
                  className="px-3 py-1 hover:bg-muted text-xs font-medium rounded disabled:opacity-50"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg truncate">
                  Module {moduleData.position}: {moduleData.title}
                </span>
                {!isReadOnly && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Edit module title"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            {!isEditing && editErrors.title && (
              <p className="text-xs text-destructive mt-1">{editErrors.title.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm whitespace-nowrap pl-10 sm:pl-0">
          <span className="text-muted-foreground">
            {moduleData.lessons.length} {moduleData.lessons.length === 1 ? "lesson" : "lessons"}
          </span>
          {!isReadOnly && (
            <button
              onClick={() => setIsAddingLesson(true)}
              className="flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Lesson
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {moduleData.lessons.length === 0 && !isAddingLesson ? (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            No lessons in this module.
          </p>
        ) : (
          <div className="space-y-3">
            {moduleData.lessons.map((lesson, index) => (
              <LessonCard
                key={lesson.id}
                courseId={courseId}
                moduleId={moduleData.id}
                lessonData={lesson}
                isFirst={index === 0}
                isLast={index === moduleData.lessons.length - 1}
                allLessonIds={moduleData.lessons.map((l) => l.id)}
              />
            ))}
          </div>
        )}

        {isAddingLesson && (
          <form
            onSubmit={handleAddSubmit(onAddLesson)}
            className="border rounded-md p-4 bg-muted/20 space-y-4 mt-4"
          >
            <h4 className="font-medium text-sm">Add New Lesson</h4>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium">Title</label>
                <input
                  {...addReg("title")}
                  autoFocus
                  className="w-full border rounded px-3 py-1.5 text-sm bg-background"
                  placeholder="Lesson title"
                />
                {addErrors.title && (
                  <p className="text-xs text-destructive">{addErrors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Content Type</label>
                <select
                  {...addReg("type")}
                  className="w-full border rounded px-3 py-1.5 text-sm bg-background"
                >
                  <option value="video">Video</option>
                  <option value="document">Document (PDF)</option>
                  <option value="article">Article (Markdown)</option>
                  <option value="external_link">External Link</option>
                </select>
                {addErrors.type && (
                  <p className="text-xs text-destructive">{addErrors.type.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Preview Access</label>
                <div className="flex items-center gap-2 h-9">
                  <input
                    type="checkbox"
                    id={`preview-${moduleData.id}`}
                    {...addReg("is_preview")}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <label
                    htmlFor={`preview-${moduleData.id}`}
                    className="text-sm text-muted-foreground"
                  >
                    Free preview lesson
                  </label>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium">Description (Optional)</label>
                <textarea
                  {...addReg("description")}
                  rows={2}
                  className="w-full border rounded px-3 py-1.5 text-sm bg-background resize-y"
                  placeholder="Brief lesson description..."
                />
                {addErrors.description && (
                  <p className="text-xs text-destructive">{addErrors.description.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsAddingLesson(false);
                  resetAdd();
                }}
                disabled={isAddSubmitting}
                className="px-3 py-1.5 text-xs font-medium hover:bg-muted rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddSubmitting}
                className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isAddSubmitting ? "Saving..." : "Save Lesson"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
