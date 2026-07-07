import { useRef, useCallback, useEffect } from "react";
import { lessonContentService } from "./services/lesson-content.service";
import { LessonProgressStatus } from "./types";
import { useAuth } from "@/features/auth/useAuth";
import { normalizeLessonPositionSeconds, normalizeLessonProgressPercent } from "./progress-utils";

export function useLessonProgress(lessonId: string, duration: number | null) {
  const { user } = useAuth();
  const lastSavedPosition = useRef<number>(-1);
  const isSaving = useRef(false);
  const pendingSave = useRef<{ position: number; status: LessonProgressStatus } | null>(null);

  const saveProgress = useCallback(
    async (positionSeconds: number, status: LessonProgressStatus, force = false) => {
      if (!user || !lessonId || duration === null || duration === undefined) return;

      const normalizedPos = normalizeLessonPositionSeconds(positionSeconds, duration);
      const percent = normalizeLessonProgressPercent(positionSeconds, duration, status);

      const finalPos =
        status === "completed" && duration && duration > 0 ? Math.floor(duration) : normalizedPos;

      if (!force && lastSavedPosition.current === finalPos && status !== "completed") {
        return;
      }

      if (isSaving.current) {
        // A completed/100 snapshot must take precedence over queued in_progress snapshots.
        if (
          status === "completed" ||
          !pendingSave.current ||
          pendingSave.current.status !== "completed"
        ) {
          pendingSave.current = { position: finalPos, status };
        }
        return;
      }

      isSaving.current = true;
      try {
        await lessonContentService.saveLessonProgress(lessonId, status, percent, finalPos);
        lastSavedPosition.current = finalPos;
        return true;
      } catch (err) {
        console.error("Failed to save progress", err);
        throw err;
      } finally {
        isSaving.current = false;
        if (pendingSave.current) {
          const next = pendingSave.current;
          pendingSave.current = null;
          saveProgress(next.position, next.status, force).catch(() => {});
        }
      }
    },
    [lessonId, duration, user],
  );

  useEffect(() => {
    lastSavedPosition.current = -1;
    pendingSave.current = null;
    isSaving.current = false;
  }, [lessonId, user]);

  return { saveProgress };
}
