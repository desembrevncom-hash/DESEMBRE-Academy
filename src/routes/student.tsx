import { createFileRoute } from "@tanstack/react-router";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { StudentProvider } from "@/features/student/StudentProvider";

export const Route = createFileRoute("/student")({
  component: () => (
    <StudentProvider>
      <StudentLayout />
    </StudentProvider>
  ),
});
