import { useState } from "react";
import { Globe, Lock, EyeOff, UploadCloud, Archive, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublishReadinessChecklist } from "./PublishReadinessChecklist";
import { useCourseEditorRegistry } from "@/features/admin/contexts/CourseEditorRegistry";
import {
  usePublishAcademyCourse,
  useUnpublishAcademyCourse,
  useArchiveAcademyCourse,
} from "@/features/admin/hooks/useAcademyAdminCourses";

export function CourseActionPanel() {
  const { editorData, settingsDirty, contentDirty, activeMutation, isReadOnly } =
    useCourseEditorRegistry();
  const { course, modules } = editorData;
  const [showConfirm, setShowConfirm] = useState<"publish" | "unpublish" | "archive" | null>(null);

  const publishMutation = usePublishAcademyCourse();
  const unpublishMutation = useUnpublishAcademyCourse();
  const archiveMutation = useArchiveAcademyCourse();

  const isMutating =
    publishMutation.isPending ||
    unpublishMutation.isPending ||
    archiveMutation.isPending ||
    activeMutation;

  const hasDirtyState = settingsDirty || contentDirty;

  // Local Readiness Check
  const hasLocalBlockingIssues =
    !course.title ||
    !course.slug ||
    modules.length === 0 ||
    !modules.some((m) => m.lessons.length > 0) ||
    !modules.every((m) =>
      m.lessons.every((l) => l.content_status === "ready" || l.content_status === "configured"),
    );

  const canPublishLocal = !hasLocalBlockingIssues;

  const handlePublish = async () => {
    if (hasDirtyState) {
      alert("Please save or cancel your unsaved changes before publishing.");
      return;
    }
    try {
      await publishMutation.mutateAsync(course.id);
      setShowConfirm(null);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to publish course.");
    }
  };

  const handleUnpublish = async () => {
    if (hasDirtyState) {
      alert("Please save or cancel your unsaved changes before unpublishing.");
      return;
    }
    try {
      await unpublishMutation.mutateAsync(course.id);
      setShowConfirm(null);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to unpublish course.");
    }
  };

  const handleArchive = async () => {
    if (hasDirtyState) {
      alert("Please save or cancel your unsaved changes before archiving.");
      return;
    }
    try {
      await archiveMutation.mutateAsync(course.id);
      setShowConfirm(null);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to archive course.");
    }
  };

  const getVisibilityIcon = () => {
    switch (course.catalog_visibility) {
      case "public":
        return <Globe className="h-4 w-4" />;
      case "private":
        return <Lock className="h-4 w-4" />;
      case "unlisted":
        return <EyeOff className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              Current Status
            </div>
            <div className="flex items-center gap-2">
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
          <div className="w-px h-8 bg-border"></div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              Visibility
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              {getVisibilityIcon()}
              <span className="capitalize">{course.catalog_visibility}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isReadOnly ? (
            <div className="px-3 py-1.5 bg-muted rounded-md text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Archive className="h-4 w-4" /> Course Archived (Read-Only)
            </div>
          ) : (
            <>
              {course.status === "draft" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setShowConfirm("archive")}
                    disabled={isMutating}
                  >
                    Archive
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowConfirm("publish")}
                    disabled={isMutating || !canPublishLocal}
                  >
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Publish Course
                  </Button>
                </>
              )}
              {course.status === "published" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirm("unpublish")}
                    disabled={isMutating}
                  >
                    Revert to Draft
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setShowConfirm("archive")}
                    disabled={isMutating}
                  >
                    Archive Course
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {hasDirtyState && !isReadOnly && (
        <div className="px-4 py-2 bg-yellow-50 text-yellow-800 border-b flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            You have unsaved changes. Please save or cancel them before changing the course status.
          </span>
        </div>
      )}

      {showConfirm === "publish" && (
        <div className="p-6 border-b bg-muted/10">
          <h3 className="text-lg font-semibold mb-2">Publish Course</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Publishing will make this course available based on your catalog visibility settings.
          </p>

          <div className="mb-6">
            <PublishReadinessChecklist editorData={editorData} />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowConfirm(null)} disabled={isMutating}>
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isMutating || hasDirtyState || !canPublishLocal}
            >
              Confirm Publish
            </Button>
          </div>
        </div>
      )}

      {showConfirm === "unpublish" && (
        <div className="p-6 border-b bg-yellow-50 text-yellow-900">
          <h3 className="text-lg font-semibold mb-2 text-yellow-950 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" /> Unpublish Course
          </h3>
          <p className="text-sm mb-6">
            Are you sure you want to revert this course to draft? It will no longer be accessible to
            students.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(null)}
              disabled={isMutating}
              className="border-yellow-300 hover:bg-yellow-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnpublish}
              disabled={isMutating || hasDirtyState}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Confirm Revert to Draft
            </Button>
          </div>
        </div>
      )}

      {showConfirm === "archive" && (
        <div className="p-6 border-b bg-destructive/10 text-destructive">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Archive className="h-5 w-5" /> Archive Course
          </h3>
          <p className="text-sm mb-6">
            Are you sure you want to archive this course? Archiving is permanent and will make the
            course read-only. Students will no longer see it in the catalog.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(null)}
              disabled={isMutating}
              className="border-destructive/30 hover:bg-destructive/20 text-destructive"
            >
              Cancel
            </Button>
            <Button
              onClick={handleArchive}
              disabled={isMutating || hasDirtyState}
              variant="destructive"
            >
              Confirm Archive
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
