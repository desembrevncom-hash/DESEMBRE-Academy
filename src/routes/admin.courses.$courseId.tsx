import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useAcademyAdminCourseEditor } from "@/features/admin/hooks/useAcademyAdminCourses";

export const Route = createFileRoute("/admin/courses/$courseId")({
  component: CourseEditorLayout,
});

function CourseEditorLayout() {
  const { courseId } = Route.useParams();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const { data: editorData, isLoading, error, refetch } = useAcademyAdminCourseEditor(courseId);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-5xl px-4">
        <div className="h-8 w-1/4 bg-muted animate-pulse rounded mb-4"></div>
        <div className="h-6 w-1/2 bg-muted animate-pulse rounded mb-8"></div>
        <div className="h-10 w-full bg-muted animate-pulse rounded mb-6"></div>
        <div className="h-96 w-full bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  if (error || !editorData) {
    return (
      <div className="container mx-auto py-8 max-w-5xl px-4">
        <div className="bg-destructive/10 text-destructive p-6 rounded-lg flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold mb-2">Error Loading Course</h2>
          <p className="mb-6">
            {(error as Error)?.message || "Course not found or access denied."}
          </p>
          <div className="flex gap-4">
            <Link
              to="/admin/courses"
              className="px-4 py-2 bg-secondary text-foreground rounded-md hover:bg-secondary/80"
            >
              Back to Courses
            </Link>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const course = editorData.course;
  const isSettingsActive = pathname.endsWith("/settings");
  const isContentActive = pathname.endsWith("/content");

  return (
    <div className="container mx-auto py-8 max-w-5xl px-4">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/courses"
            className="text-primary hover:underline text-sm mb-2 inline-block"
          >
            &larr; Back to Courses
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                course.status === "published"
                  ? "bg-green-100 text-green-800"
                  : course.status === "draft"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {course.status}
            </span>
          </div>
        </div>

        {/* Placeholder for publish actions in the future */}
        <div className="text-sm text-muted-foreground">
          ID: <span className="font-mono">{course.id.substring(0, 8)}</span>
        </div>
      </div>

      <div className="border-b mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          <Link
            to="/admin/courses/$courseId/settings"
            params={{ courseId }}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isSettingsActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            Settings
          </Link>
          <Link
            to="/admin/courses/$courseId/content"
            params={{ courseId }}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isContentActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            Content & Modules
            <span className="ml-2 bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
              {editorData.modules.length}
            </span>
          </Link>
        </nav>
      </div>

      <div className="bg-card text-card-foreground">
        <Outlet />
      </div>
    </div>
  );
}
