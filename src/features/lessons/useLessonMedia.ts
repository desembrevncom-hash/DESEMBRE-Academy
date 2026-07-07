import { useState, useEffect, useRef } from "react";
import { lessonContentService } from "./services/lesson-content.service";
import { useAuth } from "@/features/auth/useAuth";

export function calculateMediaRenewDelayMs(expiresInSeconds: number): number {
  if (!expiresInSeconds || expiresInSeconds <= 0) return 30000;
  return Math.max(30, expiresInSeconds - 60) * 1000;
}

export function useLessonMedia(courseSlug: string, lessonId: string, enabled: boolean) {
  const { user } = useAuth();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const timerRef = useRef<number | null>(null);
  const isFetchingRef = useRef(false);
  const retryCountRef = useRef(0);

  const currentRequestRef = useRef({ courseSlug, lessonId, userId: user?.id });

  useEffect(() => {
    currentRequestRef.current = { courseSlug, lessonId, userId: user?.id };
  }, [courseSlug, lessonId, user?.id]);

  useEffect(() => {
    let mounted = true;

    const clearTimers = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const fetchMedia = async () => {
      if (!enabled || !user || !courseSlug || !lessonId || isFetchingRef.current) return;

      const requestUserId = user.id;
      isFetchingRef.current = true;

      setSignedUrl((prev) => {
        if (!prev) setIsLoading(true);
        return prev;
      });

      try {
        const response = await lessonContentService.getSignedLessonMedia(courseSlug, lessonId);

        if (
          !mounted ||
          currentRequestRef.current.lessonId !== lessonId ||
          currentRequestRef.current.userId !== requestUserId
        ) {
          return;
        }

        setSignedUrl(response.signed_url);
        setError(null);
        retryCountRef.current = 0;

        const renewTimeMs = calculateMediaRenewDelayMs(response.expires_in);

        clearTimers();
        timerRef.current = window.setTimeout(() => {
          isFetchingRef.current = false;
          fetchMedia();
        }, renewTimeMs);
      } catch (err: unknown) {
        if (
          !mounted ||
          currentRequestRef.current.lessonId !== lessonId ||
          currentRequestRef.current.userId !== requestUserId
        ) {
          return;
        }

        setError(err instanceof Error ? err : new Error(String(err)));

        if (retryCountRef.current < 1) {
          retryCountRef.current += 1;
          clearTimers();
          timerRef.current = window.setTimeout(() => {
            isFetchingRef.current = false;
            fetchMedia();
          }, 5000);
        }
      } finally {
        if (mounted) {
          isFetchingRef.current = false;
          setIsLoading(false);
        }
      }
    };

    setSignedUrl(null);
    setError(null);
    setIsLoading(false);
    clearTimers();
    isFetchingRef.current = false;
    retryCountRef.current = 0;

    if (enabled && user) {
      fetchMedia();
    }

    return () => {
      mounted = false;
      clearTimers();
    };
  }, [courseSlug, lessonId, enabled, user?.id]);

  return { signedUrl, isLoading, error };
}
