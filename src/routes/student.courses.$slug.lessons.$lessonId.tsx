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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getCourseOutline, saveLessonProgress } from "@/features/courses/services/course.service";
import { useCourseRuntime } from "@/features/courses/useCourseRuntime";
import { toast } from "sonner";
import type { CourseOutline, CourseLesson } from "@/features/courses/types";

export const Route = createFileRoute("/student/courses/$slug/lessons/$lessonId")({
  component: LessonPlayer,
});

function LessonPlayer() {
  const { slug, lessonId } = Route.useParams();
  const navigate = useNavigate();
  const { refreshCurrentCourses } = useCourseRuntime();

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
    if (!outline) return [];
    return outline.modules.flatMap((m) => m.lessons.map((l) => ({ moduleId: m.id, lesson: l })));
  }, [outline]);

  const idx = flat.findIndex((f) => f.lesson.id === lessonId);
  const currentItem = idx >= 0 ? flat[idx] : null;
  const lesson = currentItem?.lesson;
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;

  const progressPct = useMemo(() => {
    if (!outline) return 0;
    const all = outline.modules.flatMap((m) => m.lessons);
    if (all.length === 0) return 0;
    const completed = all.filter((l) => l.progress?.status === "completed").length;
    return Math.round((completed / all.length) * 100);
  }, [outline]);

  const saveProgress = async (status: "in_progress" | "completed", percent: number) => {
    if (!lesson) return;
    if (lesson.is_locked) return;
    if (!outline?.access_decision.can_learn) return;

    try {
      setSaving(true);
      await saveLessonProgress(lesson.id, status, percent);
      toast.success(status === "completed" ? "Đã đánh dấu hoàn thành" : "Đã lưu tiến độ");
      await fetchOutline();
      await refreshCurrentCourses();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Lỗi lưu tiến độ");
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
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${active ? "bg-primary/10 text-primary-dark font-semibold" : "hover:bg-accent"}`}
                      >
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="flex-1 line-clamp-1">{l.title}</span>
                        {l.duration !== null && (
                          <span className="text-xs text-muted-foreground">{l.duration}p</span>
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

  return (
    <div className="space-y-4">
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
          {lesson.is_locked ? (
            <div className="aspect-video rounded-3xl border border-border/70 bg-accent grid place-items-center text-muted-foreground">
              <div className="text-center">
                <Lock className="mx-auto h-16 w-16 opacity-50" />
                <div className="mt-3 text-sm">Bài học đã bị khóa</div>
              </div>
            </div>
          ) : (
            <div className="aspect-video rounded-3xl border border-border/70 bg-gradient-to-br from-primary-dark to-primary grid place-items-center text-white">
              <div className="text-center">
                <PlayCircle className="mx-auto h-16 w-16 opacity-90" />
                <div className="mt-3 text-sm opacity-80">Trình phát video (demo)</div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="text-xs text-muted-foreground">{outline.course.title}</div>
            <h1 className="mt-1 text-2xl font-bold">{lesson.title}</h1>
            {lesson.description && (
              <p className="mt-3 text-muted-foreground">{lesson.description}</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center gap-3">
              <Button
                variant={completed ? "default" : "outline"}
                className="rounded-full"
                disabled={saving || lesson.is_locked || !outline.access_decision.can_learn}
                onClick={() =>
                  saveProgress(completed ? "in_progress" : "completed", completed ? 50 : 100)
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {completed ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
              </Button>
              {!completed && (
                <Button
                  variant="ghost"
                  className="rounded-full"
                  disabled={saving || lesson.is_locked || !outline.access_decision.can_learn}
                  onClick={() => saveProgress("in_progress", 50)}
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
        </div>

        <aside className="hidden lg:block sticky top-6 h-fit rounded-3xl border border-border/70 bg-card p-5 max-h-[calc(100dvh-3rem)] overflow-y-auto">
          <Sidebar />
          <div className="mt-4 rounded-xl bg-accent/60 p-3 text-xs text-muted-foreground flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" /> Một số bài có thể bị khóa cho đến khi bạn hoàn thành
            bài trước.
          </div>
        </aside>
      </div>
    </div>
  );
}
