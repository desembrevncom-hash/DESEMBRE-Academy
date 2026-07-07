import { useRef, useEffect } from "react";
import { useLessonMedia } from "@/features/lessons/useLessonMedia";
import { useLessonProgress } from "@/features/lessons/useLessonProgress";

interface VideoPlayerProps {
  courseSlug: string;
  lessonId: string;
  mimeType: string;
  duration: number | null;
  initialPosition?: number;
}

export function VideoPlayer({
  courseSlug,
  lessonId,
  mimeType,
  duration,
  initialPosition,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { signedUrl, isLoading, error } = useLessonMedia(courseSlug, lessonId, true);
  const { saveProgress } = useLessonProgress(lessonId, duration);

  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastThrottleTime = 0;

    const handleTimeUpdate = () => {
      const now = Date.now();
      if (now - lastThrottleTime > 5000) {
        saveProgress(video.currentTime, "in_progress", false).catch(() => {});
        lastThrottleTime = now;
      }
    };

    const handlePause = () => saveProgress(video.currentTime, "in_progress", true).catch(() => {});
    const handleSeeked = () => saveProgress(video.currentTime, "in_progress", true).catch(() => {});
    const handleEnded = () => saveProgress(video.currentTime, "completed", true).catch(() => {});

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("ended", handleEnded);
      saveProgress(video.currentTime, "in_progress", true).catch(() => {});
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

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded">Video temporarily unavailable.</div>;
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
