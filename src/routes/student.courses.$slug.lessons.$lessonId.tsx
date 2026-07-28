import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  FileText,
  List,
  Lock,
  PlayCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getCourseOutline } from "@/features/courses/services/course.service";
import { useCourseRuntime } from "@/features/courses/useCourseRuntime";
import { toast } from "sonner";
import type { CourseOutline, CourseLesson } from "@/features/courses/types";

import { useLessonContent } from "@/features/lessons/useLessonContent";
import { useLessonProgress } from "@/features/lessons/useLessonProgress";
import { ArticleRenderer } from "@/components/lessons/ArticleRenderer";
import { VideoPlayer } from "@/components/lessons/VideoPlayer";
import { DocumentViewer } from "@/components/lessons/DocumentViewer";
import { ExternalLinkViewer } from "@/components/lessons/ExternalLinkViewer";

export const Route = createFileRoute("/student/courses/$slug/lessons/$lessonId")({
  component: LessonPlayer,
});

function LessonPlayer() {
  const { slug, lessonId } = Route.useParams();
  const navigate = useNavigate();
  const { refreshCurrentCourses, enroll } = useCourseRuntime();

  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchOutline = async () => {
    try {
      setLoading(true);
      const data = await getCourseOutline(slug);
      setOutline(data);
    } catch (err: unknown) {
      setError((err as Error).message || "Lỗi tải bài học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const flat = useMemo(() => {
    if (!outline || !outline.modules) return [];
    return outline.modules.flatMap((m) => {
      if (!m || !m.lessons) return [];
      return m.lessons.map((l) => ({ moduleId: m.id, lesson: l }));
    });
  }, [outline]);

  const idx = flat.findIndex((f) => f.lesson.id === lessonId);
  const currentItem = idx >= 0 ? flat[idx] : null;
  const lesson = currentItem?.lesson;
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;

  const isLocked = lesson?.is_locked ?? false;
  const isReady = !loading && outline !== null && lesson !== undefined;

  const {
    data: contentData,
    isLoading: isContentLoading,
    error: contentError,
  } = useLessonContent({
    courseSlug: slug,
    lessonId,
    enabled: isReady && !isLocked,
  });

  const { saveProgress } = useLessonProgress(
    lessonId,
    lesson?.duration ?? null,
    lesson?.progress?.status,
    lesson?.progress?.progress_percent
  );

  const progressPct = useMemo(() => {
    if (!outline || !outline.modules) return 0;
    const all = outline.modules.flatMap((m) => m.lessons || []);
    if (all.length === 0) return 0;
    const completed = all.filter((l) => l.progress?.status === "completed").length;
    return Math.round((completed / all.length) * 100);
  }, [outline]);

  const handleSaveProgress = async (status: "in_progress" | "completed", percent: number) => {
    if (!lesson || isLocked || !outline?.access_decision.can_learn) return;

    try {
      setSaving(true);
      const source = status === "completed" ? "manual_complete" : "manual_50";
      const persistedProgress = await saveProgress(0, status, true, null, percent, source);

      if (status === "completed") {
        if (
          persistedProgress?.status === "completed" &&
          persistedProgress.progress_percent === 100
        ) {
          toast.success("Đã đánh dấu hoàn thành");
        } else {
          toast.error("Lỗi xác nhận hoàn thành từ máy chủ.");
          return;
        }
      } else {
        toast.success("Đã lưu tiến độ");
      }

      // Refetch after any successful save (50% or 100%)
      await Promise.all([fetchOutline(), refreshCurrentCourses()]);
    } catch (err: unknown) {
      toast.error("Lỗi lưu tiến độ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !outline || !lesson) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">{error || "Không tìm thấy bài học"}</h1>
          <Link to="/student/courses" className="mt-4 inline-block text-primary-dark underline">
            Quay lại khóa học
          </Link>
        </div>
      </div>
    );
  }

  const completed = lesson.progress?.status === "completed";

  const Sidebar = () => (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-muted-foreground">Tiến độ khóa học</div>
        <div className="mt-2 flex items-center gap-2">
          <Progress value={progressPct} className="h-2" />
          <div className="text-xs font-medium w-10 text-right">{progressPct}%</div>
        </div>
      </div>
      <div className="space-y-4">
        {outline.modules.map((m, mi) => (
          <div key={m.id}>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Module {mi + 1}: {m.title}
            </div>
            <ul className="space-y-1">
              {m.lessons.map((l) => {
                const active = l.id === lesson.id;
                const done = l.progress?.status === "completed";
                const isLocked = l.is_locked;

                return (
                  <li key={l.id}>
                    {isLocked ? (
                      <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm opacity-50 cursor-not-allowed">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 line-clamp-1">{l.title}</span>
                      </div>
                    ) : (
                      <Link
                        to="/student/courses/$slug/lessons/$lessonId"
                        params={{ slug: outline.course.slug, lessonId: l.id }}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                          active 
                            ? "bg-primary text-primary-foreground font-semibold shadow-sm" 
                            : done
                              ? "hover:bg-accent/70 text-success bg-success/5"
                              : "hover:bg-accent text-slate-700"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className={`h-4 w-4 ${active ? "text-primary-foreground" : "text-success"}`} />
                        ) : (
                          <Circle className={`h-4 w-4 ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
                        )}
                        <span className="flex-1 line-clamp-1">{l.title}</span>
                        {l.duration !== null && (
                          <span className={`text-xs ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{l.duration}p</span>
                        )}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContentState = () => {
    if (isLocked) {
      return (
        <div className="aspect-video rounded-3xl border border-border/70 bg-accent grid place-items-center text-muted-foreground">
          <div className="text-center">
            <Lock className="mx-auto h-16 w-16 opacity-50 mb-3" />
            <div className="font-semibold text-lg">Bài học đã bị khóa</div>
            <div className="mt-2 mb-4 text-sm max-w-md mx-auto">
              Bạn cần đăng ký khóa học này để xem được toàn bộ nội dung bài học.
            </div>

            {outline.access_decision.can_enroll ? (
              <Button
                size="lg"
                className="rounded-full shadow-lg"
                disabled={saving}
                onClick={async () => {
                  try {
                    setSaving(true);
                    await enroll(outline.course.slug);
                    toast.success("Đăng ký thành công!");
                    await Promise.all([fetchOutline(), refreshCurrentCourses()]);
                  } catch (err) {
                    toast.error("Lỗi đăng ký khóa học.");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Đăng ký khóa học ngay
              </Button>
            ) : (
              <div className="inline-flex items-center gap-2 text-sm bg-background p-3 rounded-2xl border border-border">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span>
                  {outline.access_decision.required_tier
                    ? `Yêu cầu hạng ${outline.access_decision.required_tier.name} để tham gia`
                    : outline.access_decision.reason === "ENROLLMENT_CLOSED"
                      ? "Khóa học đã đóng đăng ký"
                      : outline.access_decision.reason === "ENROLLMENT_APPROVAL_REQUIRED"
                        ? "Khóa học yêu cầu phê duyệt"
                        : outline.access_decision.reason === "ASSIGNMENT_REQUIRED"
                          ? "Khóa học yêu cầu được chỉ định"
                          : "Bạn không đủ điều kiện tham gia"}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (contentError) {
      return (
        <div className="aspect-video rounded-3xl border border-red-200 bg-red-50 grid place-items-center text-red-600">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-16 w-16 opacity-80 mb-3" />
            <div className="font-semibold">Lỗi tải nội dung</div>
            <div className="text-sm mt-1">Vui lòng thử lại sau.</div>
          </div>
        </div>
      );
    }

    if (isContentLoading || !contentData) {
      return (
        <div className="aspect-video rounded-3xl border border-border/70 bg-accent grid place-items-center text-muted-foreground">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            <div className="mt-3 text-sm">Đang tải nội dung...</div>
          </div>
        </div>
      );
    }

    if (contentData.state === "ACCESS_DENIED") {
      return (
        <div className="aspect-video rounded-3xl border border-border/70 bg-accent grid place-items-center text-muted-foreground">
          <div className="text-center">
            <Lock className="mx-auto h-16 w-16 opacity-50 mb-3" />
            <div className="font-semibold">Truy cập bị từ chối</div>
            <div className="text-sm mt-1">
              Bạn không có quyền truy cập bài học này.
            </div>
          </div>
        </div>
      );
    }

    if (contentData.state === "NOT_FOUND") {
      return (
        <div className="aspect-video rounded-3xl border border-border/70 bg-accent grid place-items-center text-muted-foreground">
          <div className="text-center">
            <FileText className="mx-auto h-16 w-16 opacity-50 mb-3" />
            <div className="font-semibold">Không tìm thấy bài học</div>
          </div>
        </div>
      );
    }

    if (contentData.state === "CONTENT_NOT_CONFIGURED" || !contentData.content) {
      return (
        <div className="aspect-video rounded-3xl border border-border/70 bg-accent grid place-items-center text-muted-foreground">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-16 w-16 opacity-50 mb-3" />
            <div className="font-semibold">Nội dung chưa được chuẩn bị</div>
            <div className="text-sm mt-1">Bài học này chưa có nội dung.</div>
          </div>
        </div>
      );
    }

    const { content } = contentData;

    switch (content.kind) {
      case "article":
        return (
          <div
            className="bg-white rounded-3xl border border-border/70 p-6 sm:p-10"
            data-testid="article-lesson-page"
          >
            <ArticleRenderer markdown={content.markdown} />
          </div>
        );
      case "video":
        return (
          <div data-testid="video-lesson-page">
            <VideoPlayer
              courseSlug={slug}
              lessonId={lessonId}
              mimeType={content.mime_type}
              mediaRef={"media_ref" in content ? content.media_ref : null}
              duration={lesson.duration}
              initialPosition={contentData.progress?.last_position_seconds}
              initialProgressStatus={contentData.progress?.status ?? lesson.progress?.status}
              onProgressComplete={() => {
                fetchOutline();
                refreshCurrentCourses();
              }}
            />
          </div>
        );
      case "document":
        return <DocumentViewer courseSlug={slug} lessonId={lessonId} />;
      case "external_link":
        return <ExternalLinkViewer url={content.url} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4" data-testid="lesson-content-page">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/student/courses"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Quay lại
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden rounded-full">
              <List className="h-4 w-4" /> Chương trình
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetTitle className="mb-4">Chương trình học</SheetTitle>
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {renderContentState()}

          <div className="mt-6">
            <div className="text-xs text-muted-foreground">{outline.course.title}</div>
            <h1 className="mt-1 text-2xl font-bold">{lesson.title}</h1>
            
            {lesson.progress && lesson.progress.progress_percent > 0 && (
              <div className="mt-4 max-w-sm">
                <div className="flex justify-between text-xs mb-1.5 font-medium text-slate-500">
                  <span>Tiến độ bài học</span>
                  <span className={completed ? "text-success" : ""}>{lesson.progress.progress_percent}%</span>
                </div>
                <Progress 
                  value={lesson.progress.progress_percent} 
                  className={`h-2 ${completed ? "[&>div]:bg-success" : ""}`} 
                />
              </div>
            )}

            {lesson.description && (
              <p className="mt-4 text-muted-foreground">{lesson.description}</p>
            )}
          </div>

          {contentData?.state !== "ACCESS_DENIED" && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-3">
              <Button
                variant={completed ? "default" : "outline"}
                className={`rounded-full ${completed ? "bg-success hover:bg-success/90 text-white border-transparent" : ""}`}
                disabled={saving || isLocked || !outline.access_decision.can_learn}
                onClick={() =>
                  handleSaveProgress(completed ? "in_progress" : "completed", completed ? 50 : 100)
                }
              >
                {saving && !completed ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                {saving && !completed
                  ? "Đang lưu tiến trình..."
                  : completed
                    ? "Đã hoàn thành"
                    : "Đánh dấu hoàn thành"}
              </Button>
              {!completed && (
                <Button
                  variant="ghost"
                  className="rounded-full"
                  disabled={saving || isLocked || !outline.access_decision.can_learn}
                  onClick={() => handleSaveProgress("in_progress", 50)}
                >
                  Đánh dấu đang học (50%)
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                disabled={!prev || prev.lesson.is_locked}
                onClick={() =>
                  prev &&
                  navigate({
                    to: "/student/courses/$slug/lessons/$lessonId",
                    params: { slug: outline.course.slug, lessonId: prev.lesson.id },
                  })
                }
              >
                <ChevronLeft className="h-4 w-4" /> Bài trước
              </Button>
              <Button
                className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground"
                disabled={!next || next.lesson.is_locked}
                onClick={() =>
                  next &&
                  navigate({
                    to: "/student/courses/$slug/lessons/$lessonId",
                    params: { slug: outline.course.slug, lessonId: next.lesson.id },
                  })
                }
              >
                Bài tiếp theo <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          )}
        </div>

        <aside className="hidden lg:block sticky top-6 h-fit rounded-3xl border border-border/70 bg-card p-5 max-h-[calc(100dvh-3rem)] overflow-y-auto">
          <Sidebar />
          <div className="mt-4 rounded-xl bg-accent/60 p-3 text-xs text-muted-foreground flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" /> Một số bài có thể bị khóa cho đến khi bạn hoàn thành
            bài trước.
          </div>
          
          {import.meta.env.DEV && import.meta.env.VITE_SHOW_ACADEMY_DEBUG_PANEL === "true" && (
            <div className="mt-6 border-t border-border/50 pt-4 text-[10px] font-mono text-slate-400">
              <div>Diagnostics:</div>
              <div>lessonId: {lessonId.slice(0, 8)}...</div>
              <div>courseSlug: {slug}</div>
              <div>raw_state: {contentData?.state || (contentError ? "ERROR" : "N/A")}</div>
              <div>parse_success: {contentData ? "true" : "false"}</div>
              <div>content_kind: {contentData?.state === "AVAILABLE" && contentData.content ? contentData.content.kind : "null"}</div>
              <div>access_denied: {contentData?.state === "ACCESS_DENIED" ? "true" : "false"}</div>
              <div>media_requested: {contentData?.state === "AVAILABLE" && contentData.content?.kind === "video" ? "true" : "false"}</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
