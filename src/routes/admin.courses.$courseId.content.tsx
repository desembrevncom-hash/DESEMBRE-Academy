import { createFileRoute } from "@tanstack/react-router";
import { ModuleLessonBuilder } from "../features/admin/components/builder/ModuleLessonBuilder";

export const Route = createFileRoute("/admin/courses/$courseId/content")({
  component: CourseContent,
});

function CourseContent() {
  const { courseId } = Route.useParams();
  return <ModuleLessonBuilder courseId={courseId} />;
}
