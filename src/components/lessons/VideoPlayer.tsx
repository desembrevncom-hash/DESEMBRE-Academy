import { useRef, useEffect } from "react";
import { useLessonMedia } from "@/features/lessons/useLessonMedia";
import { useLessonProgress } from "@/features/lessons/useLessonProgress";

interface VideoPlayerProps {
  courseSlug: string;
  lessonId: string;
  mimeType: string;
  duration: number | null;
  mediaRef?: string | null;
  initialPosition?: number;
  initialProgressStatus?: string | null;
  onProgressComplete?: () => void;
}

export function VideoPlayer({
  courseSlug,
  lessonId,
  mimeType,
  duration,
  mediaRef,
  initialPosition,
  initialProgressStatus,
  onProgressComplete,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasMedia = !!mediaRef;
  const { signedUrl, isLoading, error } = useLessonMedia(courseSlug, lessonId, hasMedia);

  const { saveProgress } = useLessonProgress(lessonId, duration, initialProgressStatus as any);

  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastThrottleTime = 0;

    const handleTimeUpdate = () => {
      const now = Date.now();
      if (now - lastThrottleTime > 5000) {
        saveProgress(video.currentTime, "in_progress", false, null, undefined, "video_autosave").catch(() => {});
        lastThrottleTime = now;
      }
    };

    const handlePause = () => saveProgress(video.currentTime, "in_progress", true, null, undefined, "video_autosave").catch(() => {});
    const handleSeeked = () => saveProgress(video.currentTime, "in_progress", true, null, undefined, "video_autosave").catch(() => {});
    const handleEnded = () => {
      saveProgress(video.currentTime, "completed", true, video.duration, undefined, "video_autosave")
        .then((persistedProgress) => {
          if (
            persistedProgress?.status === "completed" &&
            persistedProgress.progress_percent === 100
          ) {
            if (onProgressComplete) onProgressComplete();
          }
        })
        .catch(() => {});
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("ended", handleEnded);
      saveProgress(video.currentTime, "in_progress", true, null, undefined, "unmount").catch(() => {});
    };
  }, [saveProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !signedUrl || signedUrl === previousUrl.current) return;

    const isFirstLoad = previousUrl.current === null;
    previousUrl.current = signedUrl;

    const wasPaused = video.paused;
    const currentTime = video.currentTime;
    const playbackRate = video.playbackRate;
    const volume = video.volume;
    const muted = video.muted;

    video.src = signedUrl;
    video.load();

    const handleLoadedMetadata = () => {
      if (isFirstLoad && initialPosition && initialPosition > 0) {
        video.currentTime = initialPosition;
      } else if (!isFirstLoad) {
        video.currentTime = currentTime;
        video.playbackRate = playbackRate;
        video.volume = volume;
        video.muted = muted;
        if (!wasPaused) {
          video.play().catch(() => {});
        }
      }
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [signedUrl, initialPosition]);

  if (error || !hasMedia) {
    return (
      <div className="aspect-video rounded-3xl border border-border/70 bg-accent grid place-items-center text-muted-foreground p-6 text-center">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto opacity-30 mb-3"><path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8"/><path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2l10 10Z"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
          <div className="font-semibold text-lg text-slate-700">
            {error ? "File video chưa được upload." : "Bài học này chưa có video."}
          </div>
          <div className="text-sm mt-2 text-slate-500">Vui lòng quay lại sau.</div>
        </div>
      </div>
    );
  }

  // Only show loading state if we don't have a signedUrl at all
  // If we are just renewing, signedUrl is still populated.
  if (isLoading && !signedUrl) {
    return <div className="p-4 text-gray-500">Loading video...</div>;
  }

  // We unconditionally render the video element if we have a signedUrl.
  // We do NOT use signedUrl as the key. We rely on the ref to update the src.
  return (
    <video
      ref={videoRef}
      controls
      preload="metadata"
      className="w-full rounded-md shadow-sm bg-black"
      controlsList="nodownload"
    >
      Trình duyệt của bạn không hỗ trợ video.
    </video>
  );
}
