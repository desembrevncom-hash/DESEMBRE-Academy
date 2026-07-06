import { useLessonMedia } from "@/features/lessons/useLessonMedia";

interface DocumentViewerProps {
  courseSlug: string;
  lessonId: string;
}

export function DocumentViewer({ courseSlug, lessonId }: DocumentViewerProps) {
  const { signedUrl, isLoading, error } = useLessonMedia(courseSlug, lessonId, true);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded">Tài liệu tạm thời không khả dụng.</div>
    );
  }

  if (isLoading || !signedUrl) {
    return <div className="p-4 text-gray-500">Đang tải tài liệu...</div>;
  }

  return (
    <div className="p-6 bg-slate-50 border rounded-md flex flex-col items-center justify-center">
      <h3 className="text-lg font-medium mb-4">Tài liệu bài học</h3>
      <a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Mở / Tải xuống tài liệu
      </a>
    </div>
  );
}
