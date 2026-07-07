import { useRef, useCallback, useEffect } from "react";
import { lessonContentService } from "./services/lesson-content.service";
import { LessonProgressStatus } from "./types";
import { useAuth } from "@/features/auth/useAuth";
import { normalizeLessonPositionSeconds, normalizeLessonProgressPercent } from "./progress-utils";

export interface UseLessonProgressOptions {
  onSuccess?: (status: LessonProgressStatus) => void;
}

export function useLessonProgress(
  lessonId: string,
  duration: number | null,
  options?: UseLessonProgressOptions
) {
  const { user } = useAuth();
  const lastSavedPosition = useRef<number>(-1);
  const isSaving = useRef(false);
  const pendingSave = useRef<{ position: number; status: LessonProgressStatus; actualMediaDuration?: number | null } | null>(null);
  
  // Explicit completion latch scoped to userId + lessonId
  const completionCommittedRef = useRef<string | null>(null);

  const saveProgress = useCallback(
    async (
      positionSeconds: number,
      status: LessonProgressStatus,
      force = false,
      actualMediaDuration?: number | null
    ) => {
      if (!user || !lessonId || duration === null || duration === undefined) return;

      const currentLatch = `${user.id}-${lessonId}`;
      if (completionCommittedRef.current === currentLatch && status !== "completed") {
        // Ignore stale in_progress events if we already committed completion for this lesson session
        return;
      }

      if (status === "completed") {
        completionCommittedRef.current = currentLatch;
      }

      const effectiveDuration = (status === "completed" && typeof actualMediaDuration === "number" && isFinite(actualMediaDuration) && actualMediaDuration > 0)
        ? actualMediaDuration
        : duration;

      const normalizedPos = normalizeLessonPositionSeconds(positionSeconds, effectiveDuration);
      const percent = normalizeLessonProgressPercent(positionSeconds, effectiveDuration, status);
      
      const finalPos = (status === "completed" && effectiveDuration > 0) 
        ? Math.floor(effectiveDuration) 
        : normalizedPos;

      if (!force && lastSavedPosition.current === finalPos && status !== "completed") {
        return;
      }

      if (isSaving.current) {
        // A completed snapshot takes precedence over older pending in_progress snapshots
        if (status === "completed" || !pendingSave.current || pendingSave.current.status !== "completed") {
          pendingSave.current = { position: finalPos, status, actualMediaDuration };
        }
        return;
      }

      isSaving.current = true;
      try {
        await lessonContentService.saveLessonProgress(lessonId, status, percent, finalPos);
        lastSavedPosition.current = finalPos;
        if (options?.onSuccess) {
          options.onSuccess(status);
        }
        return true;
      } catch (err) {
        console.error("Failed to save progress", err);
        throw err;
      } finally {
        isSaving.current = false;
        if (pendingSave.current) {
          const next = pendingSave.current;
          pendingSave.current = null;
          saveProgress(next.position, next.status, force, next.actualMediaDuration).catch(() => {});
        }
      }
    },
    [lessonId, duration, user, options]
  );

  useEffect(() => {
    lastSavedPosition.current = -1;
    pendingSave.current = null;
    isSaving.current = false;
    // Do not reset the latch on every render, only when lessonId or user changes (handled by deps)
    completionCommittedRef.current = null;
  }, [lessonId, user]);

  return { saveProgress };
}
