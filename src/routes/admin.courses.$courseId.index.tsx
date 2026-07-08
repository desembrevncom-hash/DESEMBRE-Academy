import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/courses/$courseId/")({
  component: CourseEditorIndexRedirect,
});

function CourseEditorIndexRedirect() {
  const { courseId } = Route.useParams();
  return <Navigate to="/admin/courses/$courseId/settings" params={{ courseId }} replace />;
}
