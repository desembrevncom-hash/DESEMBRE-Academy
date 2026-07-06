import { useRef, useCallback, useEffect } from "react";
import { lessonContentService } from "./services/lesson-content.service";
import { LessonProgressStatus } from "./types";
import { useAuth } from "@/features/auth/useAuth";

export function useLessonProgress(lessonId: string, duration: number | null) {
  const { user } = useAuth();
  const lastSavedPosition = useRef<number>(-1);
  const isSaving = useRef(false);
  const pendingSave = useRef<{ position: number; status: LessonProgressStatus } | null>(null);

  const saveProgress = useCallback(
    async (positionSeconds: number, status: LessonProgressStatus, force = false) => {
      if (!user || !lessonId || duration === null || duration === undefined) return;

      let clampedPos = Math.max(0, positionSeconds);
      if (duration > 0) {
        clampedPos = Math.min(clampedPos, duration);
      }

      let percent = 0;
      if (duration && duration > 0) {
        percent = Math.min(100, Math.max(0, (clampedPos / duration) * 100));
      }
      if (status === "completed") percent = 100;

      if (!force && lastSavedPosition.current === clampedPos && status !== "completed") {
        return;
      }

      if (isSaving.current) {
        pendingSave.current = { position: clampedPos, status };
        return;
      }

      isSaving.current = true;
      try {
        await lessonContentService.saveLessonProgress(lessonId, status, percent, clampedPos);
        lastSavedPosition.current = clampedPos;
        return true;
      } catch (err) {
        console.error("Failed to save progress", err);
        throw err;
      } finally {
        isSaving.current = false;
        if (pendingSave.current) {
          const next = pendingSave.current;
          pendingSave.current = null;
          saveProgress(next.position, next.status, force);
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
