import { useRef, useCallback, useEffect } from "react";
import { lessonContentService } from "./services/lesson-content.service";
import { LessonProgressStatus } from "./types";
import { useAuth } from "@/features/auth/useAuth";

export function normalizeLessonPositionSeconds(
  positionSeconds: number,
  durationSeconds?: number | null,
): number {
  if (
    typeof positionSeconds !== "number" ||
    isNaN(positionSeconds) ||
    !isFinite(positionSeconds) ||
    positionSeconds < 0
  ) {
    positionSeconds = 0;
  }
  let normalized = Math.floor(positionSeconds);

  if (typeof durationSeconds === "number" && isFinite(durationSeconds) && durationSeconds > 0) {
    const maxDuration = Math.floor(durationSeconds);
    if (normalized > maxDuration) {
      normalized = maxDuration;
    }
  }
  return normalized;
}

export function useLessonProgress(lessonId: string, duration: number | null) {
  const { user } = useAuth();
  const lastSavedPosition = useRef<number>(-1);
  const isSaving = useRef(false);
  const pendingSave = useRef<{ position: number; status: LessonProgressStatus } | null>(null);

  const saveProgress = useCallback(
    async (positionSeconds: number, status: LessonProgressStatus, force = false) => {
      if (!user || !lessonId || duration === null || duration === undefined) return;

      const normalizedPos = normalizeLessonPositionSeconds(positionSeconds, duration);

      let percent = 0;
      if (duration && duration > 0) {
        percent = Math.min(99.99, Math.max(0, (normalizedPos / duration) * 100));
      }

      if (status === "completed") {
        percent = 100;
        // If we complete, and there's a duration, ensure we reflect the full floored duration if possible
        // But the user might complete manually early. The rule says:
        // "last position must be the normalized media duration when available; otherwise use the latest normalized current position."
      }

      const finalPos =
        status === "completed" && duration && duration > 0 ? Math.floor(duration) : normalizedPos;

      if (!force && lastSavedPosition.current === finalPos && status !== "completed") {
        return;
      }

      if (isSaving.current) {
        pendingSave.current = { position: finalPos, status };
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
