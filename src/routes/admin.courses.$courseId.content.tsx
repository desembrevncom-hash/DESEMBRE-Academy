import { createFileRoute } from "@tanstack/react-router";
import { ModuleLessonBuilder } from "../features/admin/components/builder/ModuleLessonBuilder";
import { LessonContentPanel } from "../features/admin/components/builder/LessonContentPanel";
import { useAcademyAdminCourseEditor } from "../features/admin/hooks/useAcademyAdminCourses";

export const Route = createFileRoute("/admin/courses/$courseId/content")({
  validateSearch: (search: Record<string, unknown>): { lessonId?: string } => {
    return {
      lessonId: typeof search.lessonId === "string" ? search.lessonId : undefined,
    };
  },
  component: CourseContent,
});

function CourseContent() {
  const { courseId } = Route.useParams();
  const { lessonId } = Route.useSearch();
  const { data, isLoading, isError } = useAcademyAdminCourseEditor(courseId);

  return (
    <div className={`flex flex-col lg:flex-row gap-8 ${lessonId ? "h-[calc(100vh-12rem)]" : ""}`}>
      <div className={`${lessonId ? "lg:w-1/3" : "w-full"} flex-shrink-0 overflow-y-auto pr-2`}>
        <ModuleLessonBuilder courseId={courseId} />
      </div>

      {lessonId && (
        <div className="lg:w-2/3 flex-shrink-0 flex flex-col h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full bg-card border rounded-md">
              <span className="text-muted-foreground animate-pulse">Loading editor...</span>
            </div>
          ) : isError || !data ? (
            <div className="flex items-center justify-center h-full bg-card border rounded-md">
              <span className="text-destructive">Failed to load editor</span>
            </div>
          ) : (
            <LessonContentPanel courseEditor={data} lessonId={lessonId} />
          )}
        </div>
      )}
    </div>
  );
}
