import { useRef, useCallback, useEffect } from "react";
import { lessonContentService, isRetryableNetworkError } from "./services/lesson-content.service";
import { LessonProgressStatus, LessonProgressPayload } from "./types";
import { useAuth } from "@/features/auth/useAuth";
import { normalizeLessonPositionSeconds, normalizeLessonProgressPercent } from "./progress-utils";

const globalCompletionLatch = new Set<string>();

export function resetGlobalCompletionLatchForTesting() {
  globalCompletionLatch.clear();
}

export interface UseLessonProgressOptions {
  onSuccess?: (status: LessonProgressStatus) => void;
}

export function useLessonProgress(
  lessonId: string,
  duration: number | null,
  options?: UseLessonProgressOptions,
) {
  const { user } = useAuth();
  const lastSavedPosition = useRef<number>(-1);
  const isSaving = useRef(false);
  const pendingSave = useRef<{
    position: number;
    status: LessonProgressStatus;
    actualMediaDuration?: number | null;
  } | null>(null);

  // Explicit completion latch scoped to userId + lessonId
  // Used to prevent unmount/remount cleanups from overwriting completion with in_progress

  const saveProgress = useCallback(
    async (
      positionSeconds: number,
      status: LessonProgressStatus,
      force = false,
      actualMediaDuration?: number | null,
    ): Promise<LessonProgressPayload | undefined> => {
      if (!user || !lessonId || duration === null || duration === undefined) return undefined;

      const currentLatch = `${user.id}-${lessonId}`;
      if (globalCompletionLatch.has(currentLatch) && status !== "completed") {
        return undefined;
      }

      if (status === "completed") {
        globalCompletionLatch.add(currentLatch);
      }

      const effectiveDuration =
        status === "completed" &&
        typeof actualMediaDuration === "number" &&
        isFinite(actualMediaDuration) &&
        actualMediaDuration > 0
          ? actualMediaDuration
          : duration;

      const normalizedPos = normalizeLessonPositionSeconds(positionSeconds, effectiveDuration);
      const percent = normalizeLessonProgressPercent(positionSeconds, effectiveDuration, status);

      const finalPos =
        status === "completed" && effectiveDuration > 0
          ? Math.floor(effectiveDuration)
          : normalizedPos;

      if (!force && lastSavedPosition.current === finalPos && status !== "completed") {
        return undefined;
      }

      if (isSaving.current) {
        if (
          status === "completed" ||
          !pendingSave.current ||
          pendingSave.current.status !== "completed"
        ) {
          pendingSave.current = { position: finalPos, status, actualMediaDuration };
        }
        return undefined;
      }

      isSaving.current = true;
      let attempt = 0;
      let maxAttempts = status === "completed" ? 3 : 1;
      let lastErr: unknown = null;
      let persistedProgress: LessonProgressPayload | undefined;

      while (attempt < maxAttempts) {
        attempt++;
        try {
          persistedProgress = await lessonContentService.saveLessonProgress(
            lessonId,
            status,
            percent,
            finalPos,
          );
          lastSavedPosition.current = finalPos;
          if (options?.onSuccess) {
            options.onSuccess(status);
          }
          break; // success
        } catch (err) {
          lastErr = err;
          if (status === "completed" && attempt < maxAttempts && isRetryableNetworkError(err)) {
            console.warn(
              `progress save transport failure. attempt ${attempt} for ${lessonId.slice(-8)}`,
            );
            await new Promise((r) => setTimeout(r, attempt === 1 ? 500 : 1500));
            continue;
          } else {
            // Unrecoverable or max attempts reached
            break;
          }
        }
      }

      isSaving.current = false;

      if (!persistedProgress) {
        if (status === "completed") {
          // Re-queue the completed snapshot so it remains pending for manual retry
          if (!pendingSave.current || pendingSave.current.status !== "completed") {
            pendingSave.current = { position: finalPos, status, actualMediaDuration };
          }
        }

        if (pendingSave.current && pendingSave.current.status !== "completed") {
          const next = pendingSave.current;
          pendingSave.current = null;
          saveProgress(next.position, next.status, force, next.actualMediaDuration).catch(() => {});
        }

        console.error("Failed to save progress", lastErr);
        throw lastErr;
      }

      // Success branch - process queue
      if (pendingSave.current) {
        const next = pendingSave.current;
        pendingSave.current = null;
        saveProgress(next.position, next.status, force, next.actualMediaDuration).catch(() => {});
      }

      return persistedProgress;
    },
    [lessonId, duration, user, options],
  );

  useEffect(() => {
    lastSavedPosition.current = -1;
    pendingSave.current = null;
    isSaving.current = false;
  }, [lessonId, user]);

  return { saveProgress };
}
