import { useState, useEffect, useRef, useCallback } from "react";
import { lessonContentService } from "./services/lesson-content.service";
import { useAuth } from "@/features/auth/useAuth";

export function useLessonMedia(courseSlug: string, lessonId: string, enabled: boolean) {
  const { user } = useAuth();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const timerRef = useRef<number | null>(null);
  const isFetchingRef = useRef(false);
  const retryCountRef = useRef(0);

  const clearState = useCallback(() => {
    setSignedUrl(null);
    setError(null);
    setIsLoading(false);
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isFetchingRef.current = false;
    retryCountRef.current = 0;
  }, []);

  const fetchMedia = useCallback(async () => {
    if (!enabled || !user || !courseSlug || !lessonId || isFetchingRef.current) return;

    isFetchingRef.current = true;
    if (!signedUrl) {
      setIsLoading(true);
    }

    try {
      const response = await lessonContentService.getSignedLessonMedia(courseSlug, lessonId);
      setSignedUrl(response.signed_url);
      setError(null);
      retryCountRef.current = 0;

      // TTL is typically 300s. Renew 60s before expiry.
      const renewTimeMs = Math.max((response.expires_in - 60) * 1000, 10000);

      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        isFetchingRef.current = false;
        fetchMedia();
      }, renewTimeMs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
      if (retryCountRef.current < 1) {
        retryCountRef.current += 1;
        isFetchingRef.current = false;
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          fetchMedia();
        }, 5000);
      } else {
        setSignedUrl(null);
      }
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [courseSlug, lessonId, enabled, user, signedUrl]);

  useEffect(() => {
    clearState();
    if (enabled && user) {
      fetchMedia();
    }
    return () => {
      clearState();
    };
  }, [courseSlug, lessonId, enabled, user, fetchMedia, clearState]);

  return { signedUrl, isLoading, error };
}
