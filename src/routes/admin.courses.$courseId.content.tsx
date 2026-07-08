import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/courses/$courseId/content")({
  component: CourseContentPlaceholder,
});

function CourseContentPlaceholder() {
  return (
    <div className="bg-card text-card-foreground border rounded-lg shadow-sm p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Module and Lesson Builder</h2>
        <p className="text-muted-foreground mb-6">
          The content builder is currently under construction. Module and lesson editing, media
          uploading, and publishing workflows are scheduled for the next milestone (M6B.2).
        </p>
      </div>
    </div>
  );
}
