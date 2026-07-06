import { createFileRoute } from "@tanstack/react-router";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { StudentProvider } from "@/features/student/StudentProvider";
import { CourseRuntimeProvider } from "@/features/courses/CourseRuntimeProvider";

export const Route = createFileRoute("/student")({
  component: () => (
    <StudentProvider>
      <CourseRuntimeProvider>
        <StudentLayout />
      </CourseRuntimeProvider>
    </StudentProvider>
  ),
});
