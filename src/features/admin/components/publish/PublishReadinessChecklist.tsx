import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { AcademyAdminCourseEditor } from "@/features/admin/types";

interface PublishReadinessChecklistProps {
  editorData: AcademyAdminCourseEditor;
}

export function PublishReadinessChecklist({ editorData }: PublishReadinessChecklistProps) {
  const { course, modules } = editorData;

  const checks = [
    {
      id: "title",
      label: "Title is set",
      passed: Boolean(course.title && course.title.length > 0),
    },
    {
      id: "slug",
      label: "Slug is configured",
      passed: Boolean(course.slug && course.slug.length > 0),
    },
    {
      id: "modules",
      label: "Has at least one module",
      passed: modules.length > 0,
    },
    {
      id: "lessons",
      label: "Has at least one lesson",
      passed: modules.some((m) => m.lessons.length > 0),
    },
    {
      id: "content",
      label: "All lessons have content",
      passed:
        modules.length > 0 &&
        modules.every((m) =>
          m.lessons.every((l) => l.content_status === "ready" || l.content_status === "configured"),
        ),
      // If there are no modules/lessons, this shouldn't fail independently, just follow the ones above.
      // But if there are lessons, they must have content.
    },
  ];

  const allPassed = checks.every((c) => c.passed);

  return (
    <div className="bg-muted/30 rounded-lg p-4 border text-sm">
      <h3 className="font-semibold mb-3 flex items-center justify-between">
        <span>Local readiness check</span>
        {allPassed ? (
          <span className="text-green-600 text-xs flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Passed
          </span>
        ) : (
          <span className="text-destructive text-xs flex items-center gap-1">
            <XCircle className="h-4 w-4" /> Issues found
          </span>
        )}
      </h3>

      <ul className="space-y-2 mb-4">
        {checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2">
            {check.passed ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            )}
            <span
              className={check.passed ? "text-muted-foreground" : "text-foreground font-medium"}
            >
              {check.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="text-xs text-muted-foreground flex items-start gap-1.5 pt-3 border-t">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>Final validation will be performed by the backend.</p>
      </div>
    </div>
  );
}
