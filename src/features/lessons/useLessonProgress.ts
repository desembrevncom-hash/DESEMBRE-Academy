import { useRef, useCallback, useEffect } from "react";
import { lessonContentService, isRetryableNetworkError } from "./services/lesson-content.service";
import { LessonProgressStatus, LessonProgressPayload } from "./types";
import { useAuth } from "@/features/auth/useAuth";
import { normalizeLessonPositionSeconds, normalizeLessonProgressPercent } from "./progress-utils";

class CompletionRegistry {
  private latch = new Set<string>();

  markCompleted(userId: string, lessonId: string) {
    if (typeof window === "undefined" && process.env.NODE_ENV !== "test") return;
    this.latch.add(`${userId}-${lessonId}`);
  }

  isCompleted(userId: string, lessonId: string): boolean {
    if (typeof window === "undefined" && process.env.NODE_ENV !== "test") return false;
    return this.latch.has(`${userId}-${lessonId}`);
  }

  clearForTesting() {
    this.latch.clear();
  }
}

export const completionRegistry = new CompletionRegistry();

export function resetGlobalCompletionLatchForTesting() {
  completionRegistry.clearForTesting();
}

export interface UseLessonProgressOptions {
  onSuccess?: (status: LessonProgressStatus) => void;
}

export function useLessonProgress(
  lessonId: string,
  duration: number | null,
  initialStatus?: LessonProgressStatus | null,
  initialPercent?: number | null,
  options?: UseLessonProgressOptions,
) {
  const { user } = useAuth();

  if (user && lessonId && initialStatus === "completed") {
    completionRegistry.markCompleted(user.id, lessonId);
  }

  const lastSavedPosition = useRef<number>(-1);
  const isSaving = useRef(false);
  const pendingSave = useRef<{
    position: number;
    status: LessonProgressStatus;
    actualMediaDuration?: number | null;
    overridePercent?: number;
    source?: string;
  } | null>(null);

  const highestSavedPercent = useRef<number>(
    initialPercent != null ? initialPercent : (initialStatus === "completed" ? 100 : 0)
  );

  // Explicit completion latch scoped to userId + lessonId
  // Used to prevent unmount/remount cleanups from overwriting completion with in_progress

  const saveProgress = useCallback(
    async (
      positionSeconds: number,
      status: LessonProgressStatus,
      force = false,
      actualMediaDuration?: number | null,
      overridePercent?: number,
      source?: string
    ): Promise<LessonProgressPayload | undefined> => {
      if (!user || !lessonId || duration === null || duration === undefined) return undefined;

      if (completionRegistry.isCompleted(user.id, lessonId) && status !== "completed") {
        return undefined;
      }

      if (status === "completed") {
        completionRegistry.markCompleted(user.id, lessonId);
      }

      const effectiveDuration =
        status === "completed" &&
        typeof actualMediaDuration === "number" &&
        isFinite(actualMediaDuration) &&
        actualMediaDuration > 0
          ? actualMediaDuration
          : duration;

      const normalizedPos = normalizeLessonPositionSeconds(positionSeconds, effectiveDuration);
      let percent = normalizeLessonProgressPercent(positionSeconds, effectiveDuration, status);
      if (typeof overridePercent === "number") {
        percent = overridePercent;
      }

      // Prevent background saves from decreasing progress
      const isManual = source?.startsWith("manual_");
      if (isManual) {
        highestSavedPercent.current = Math.max(highestSavedPercent.current, percent);
      } else {
        if (percent < highestSavedPercent.current) {
          console.log(`[LessonProgress] skipping source=${source} percent=${percent} because highestSaved=${highestSavedPercent.current}`);
          return undefined;
        }
        highestSavedPercent.current = Math.max(highestSavedPercent.current, percent);
      }

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
          pendingSave.current = { position: finalPos, status, actualMediaDuration, overridePercent, source };
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
          console.log(`[LessonProgress] saving source=${source || "unknown"} lesson=${lessonId.substring(0, 8)} percent=${percent} completed=${status === "completed"}`);
          persistedProgress = await lessonContentService.saveLessonProgress(
            lessonId,
            status,
            percent,
            finalPos,
          );
          console.log(`[LessonProgress] saved progress=${persistedProgress.progress_percent}`);
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
            pendingSave.current = { position: finalPos, status, actualMediaDuration, overridePercent, source };
          }
        }

        if (pendingSave.current && pendingSave.current.status !== "completed") {
          const next = pendingSave.current;
          pendingSave.current = null;
          saveProgress(next.position, next.status, force, next.actualMediaDuration, next.overridePercent, next.source).catch(() => {});
        }

        console.error("Failed to save progress", lastErr);
        throw lastErr;
      }

      // Success branch - process queue
      if (pendingSave.current) {
        const next = pendingSave.current;
        pendingSave.current = null;
        saveProgress(next.position, next.status, force, next.actualMediaDuration, next.overridePercent, next.source).catch(() => {});
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
