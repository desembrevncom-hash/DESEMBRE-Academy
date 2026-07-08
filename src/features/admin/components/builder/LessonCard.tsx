import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  GripVertical,
  FileText,
  Video,
  File,
  Link2,
  Eye,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";
import {
  useUpdateAcademyLesson,
  useReorderAcademyLessons,
} from "../../hooks/useAcademyAdminCourses";
import { lessonSchema, type LessonFormData } from "../../validators";
import type { AcademyAdminLesson } from "../../types";
import { ContentTypeStatus } from "./ContentTypeStatus";

interface LessonCardProps {
  courseId: string;
  moduleId: string;
  lessonData: AcademyAdminLesson;
  isFirst: boolean;
  isLast: boolean;
  allLessonIds: string[];
}

export function LessonCard({
  courseId,
  moduleId,
  lessonData,
  isFirst,
  isLast,
  allLessonIds,
}: LessonCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const updateLesson = useUpdateAcademyLesson(courseId);
  const reorderLessons = useReorderAcademyLessons(courseId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema) as unknown as Resolver<LessonFormData>,
    defaultValues: {
      title: lessonData.title,
      type: lessonData.type,
      description: lessonData.description || "",
      is_preview: lessonData.is_preview,
    },
  });

  const onEdit = async (data: LessonFormData) => {
    try {
      await updateLesson.mutateAsync({
        p_lesson_id: lessonData.id,
        p_title: data.title,
        p_description: data.description || null,
        p_is_preview: data.is_preview,
        // Backend doesn't support updating lesson type
      });
      toast.success("Lesson updated");
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update lesson");
    }
  };

  const handleReorder = async (direction: "up" | "down") => {
    if (reorderLessons.isPending) return;

    const currentIndex = allLessonIds.indexOf(lessonData.id);
    if (currentIndex === -1) return;
    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === allLessonIds.length - 1) return;

    const newOrder = [...allLessonIds];
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    [newOrder[currentIndex], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[currentIndex]];

    try {
      await reorderLessons.mutateAsync({
        p_module_id: moduleId,
        p_lesson_ids: newOrder,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reorder lessons");
    }
  };

  const getTypeIcon = () => {
    switch (lessonData.type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "document":
        return <File className="w-4 h-4" />;
      case "external_link":
        return <Link2 className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit(onEdit)}
        className="border rounded-md p-4 bg-background space-y-4"
      >
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Edit Lesson</h4>
          <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground capitalize">
            {lessonData.type.replace("_", " ")}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium">Title</label>
            <input
              {...register("title")}
              autoFocus
              className="w-full border rounded px-3 py-1.5 text-sm bg-background"
              placeholder="Lesson title"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium flex items-center gap-2">Preview Access</label>
            <div className="flex items-center gap-2 h-9">
              <input
                type="checkbox"
                id={`preview-edit-${lessonData.id}`}
                {...register("is_preview")}
                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
              />
              <label
                htmlFor={`preview-edit-${lessonData.id}`}
                className="text-sm text-muted-foreground"
              >
                Free preview lesson
              </label>
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium">Description (Optional)</label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full border rounded px-3 py-1.5 text-sm bg-background resize-y"
              placeholder="Brief lesson description..."
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs font-medium hover:bg-muted rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="border rounded-md bg-background flex flex-col group">
      <div className="flex items-center gap-3 p-3">
        <div className="flex flex-col gap-1 items-center justify-center text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleReorder("up")}
            disabled={isFirst || reorderLessons.isPending}
            className="hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors p-0.5"
            aria-label="Move lesson up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleReorder("down")}
            disabled={isLast || reorderLessons.isPending}
            className="hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors p-0.5"
            aria-label="Move lesson down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 text-muted-foreground shrink-0">
          {getTypeIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{lessonData.title}</span>
            {lessonData.is_preview && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-medium leading-none">
                <Eye className="w-3 h-3" />
                Preview
              </span>
            )}
          </div>
          {lessonData.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {lessonData.description}
            </p>
          )}
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Edit lesson details"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      <div className="px-12 pb-3">
        <ContentTypeStatus type={lessonData.type} status={lessonData.content_status} />

        {/* Placeholder for M6B.3 editor links */}
        <div className="mt-2 text-xs text-muted-foreground border-l-2 border-primary/20 pl-3 py-1">
          {lessonData.type === "article" && "Article editor comes in M6B.3"}
          {(lessonData.type === "video" || lessonData.type === "document") &&
            "Media upload comes in M6B.3"}
          {lessonData.type === "external_link" && "External-link editor comes in M6B.3"}
        </div>
      </div>
    </div>
  );
}
