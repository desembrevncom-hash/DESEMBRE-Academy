import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  FileText,
  List,
  Lock,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getCourseBySlug } from "@/data/courses";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import type { Course, Lesson } from "@/types";

export const Route = createFileRoute("/student/courses/$slug/lessons/$lessonId")({
  loader: ({ params }) => {
    const course = getCourseBySlug(params.slug);
    if (!course) throw notFound();
    const allLessons = course.modules.flatMap((m) => m.lessons);
    const lesson = allLessons.find((l) => l.id === params.lessonId);
    if (!lesson) throw notFound();
    return { course: course as Course, lesson: lesson as Lesson };
  },
  component: LessonPlayer,
});

function LessonPlayer() {
  const { course, lesson } = Route.useLoaderData() as { course: Course; lesson: Lesson };
  const navigate = useNavigate();
  const { toggleLesson, isLessonCompleted, getCourseProgress } = useAppStore();

  const flat = useMemo(
    () => course.modules.flatMap((m) => m.lessons.map((l) => ({ moduleId: m.id, lesson: l }))),
    [course],
  );
  const idx = flat.findIndex((f) => f.lesson.id === lesson.id);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;
  const completed = isLessonCompleted(lesson.id);
  const progressPct = getCourseProgress(course.id);
  const [notes, setNotes] = useState("");

  const toggle = (v: boolean) => {
    toggleLesson(course.id, lesson.id, v);
    toast.success(v ? "Đã đánh dấu hoàn thành" : "Đã bỏ đánh dấu");
  };

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
        {course.modules.map((m, mi) => (
          <div key={m.id}>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Module {mi + 1}: {m.title}
            </div>
            <ul className="space-y-1">
              {m.lessons.map((l) => {
                const active = l.id === lesson.id;
                const done = isLessonCompleted(l.id);
                return (
                  <li key={l.id}>
                    <Link
                      to="/student/courses/$slug/lessons/$lessonId"
                      params={{ slug: course.slug, lessonId: l.id }}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${active ? "bg-primary/10 text-primary-dark font-semibold" : "hover:bg-accent"}`}
                    >
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="flex-1 line-clamp-1">{l.title}</span>
                      <span className="text-xs text-muted-foreground">{l.duration}p</span>
                    </Link>
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
          <ChevronLeft className="h-4 w-4" /> Quay lại khóa học
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
          <div className="aspect-video rounded-3xl border border-border/70 bg-gradient-to-br from-primary-dark to-primary grid place-items-center text-white">
            <div className="text-center">
              <PlayCircle className="mx-auto h-16 w-16 opacity-90" />
              <div className="mt-3 text-sm opacity-80">Trình phát video (demo)</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="text-xs text-muted-foreground">{course.title}</div>
            <h1 className="mt-1 text-2xl font-bold">{lesson.title}</h1>
            <p className="mt-3 text-muted-foreground">{lesson.description}</p>
          </div>

          {lesson.resources && lesson.resources.length > 0 && (
            <div className="mt-6 rounded-2xl border border-border/70 bg-card p-4">
              <div className="text-sm font-semibold mb-2">Tài liệu bài học</div>
              <ul className="space-y-2 text-sm">
                {lesson.resources.map((r) => (
                  <li key={r.name} className="flex items-center gap-2 text-primary-dark">
                    <FileText className="h-4 w-4" /> {r.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-border/70 bg-card p-4">
            <div className="text-sm font-semibold mb-2">Ghi chú cá nhân</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi lại ý chính, câu hỏi của bạn..."
              className="w-full min-h-24 rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <Checkbox checked={completed} onCheckedChange={(v) => toggle(Boolean(v))} />
              Đánh dấu hoàn thành
            </label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                disabled={!prev}
                onClick={() =>
                  prev &&
                  navigate({
                    to: "/student/courses/$slug/lessons/$lessonId",
                    params: { slug: course.slug, lessonId: prev.lesson.id },
                  })
                }
              >
                <ChevronLeft className="h-4 w-4" /> Bài trước
              </Button>
              <Button
                className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground"
                disabled={!next}
                onClick={() =>
                  next &&
                  navigate({
                    to: "/student/courses/$slug/lessons/$lessonId",
                    params: { slug: course.slug, lessonId: next.lesson.id },
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
