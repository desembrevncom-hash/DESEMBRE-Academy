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

  const isMetadataLoaded = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastThrottleTime = 0;

    const handleTimeUpdate = () => {
      const now = Date.now();
      if (now - lastThrottleTime > 5000) {
        saveProgress(video.currentTime, "in_progress", false);
        lastThrottleTime = now;
      }
    };

    const handlePause = () => saveProgress(video.currentTime, "in_progress", true);
    const handleSeeked = () => saveProgress(video.currentTime, "in_progress", true);
    const handleEnded = () => saveProgress(video.currentTime, "completed", true);
    const handleLoadedMetadata = () => {
      isMetadataLoaded.current = true;
      if (initialPosition && initialPosition > 0) {
        video.currentTime = initialPosition;
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      saveProgress(video.currentTime, "in_progress", true);
    };
  }, [saveProgress, initialPosition]);

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded">Video temporarily unavailable.</div>;
  }

  if (isLoading || !signedUrl) {
    return <div className="p-4 text-gray-500">Loading video...</div>;
  }

  return (
    <video
      ref={videoRef}
      controls
      preload="metadata"
      className="w-full rounded-md shadow-sm bg-black"
      controlsList="nodownload"
    >
      <source src={signedUrl} type={mimeType} />
      Trình duyệt của bạn không hỗ trợ video.
    </video>
  );
}
