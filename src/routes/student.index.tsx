import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, PlayCircle, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStudent } from "@/features/student/useStudent";
import { useAuth } from "@/features/auth/useAuth";
import { useCourseRuntime } from "@/features/courses/useCourseRuntime";

export const Route = createFileRoute("/student/")({
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function Dashboard() {
  const { customer } = useStudent();
  const { session } = useAuth();
  const { currentCourses, catalog } = useCourseRuntime();

  const activeCourses = currentCourses.filter((c) => c.enrollment.status === "active");
  const completedLessons = currentCourses.reduce((sum, c) => sum + c.completed_lessons, 0);

  const continueCourse = activeCourses.length > 0 ? activeCourses[0] : null;
  const recommended = catalog
    .filter((c) => !currentCourses.some((cc) => cc.course.id === c.id))
    .slice(0, 3);

  const displayName = customer?.name || session?.user?.email || "Student";

  return (
    <div className="space-y-8">
      <div className="rounded-3xl hero-bg border border-border/60 p-8">
        <div className="text-xs text-primary-dark font-medium">Bảng điều khiển</div>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold">
          {greeting()}, {displayName}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tiếp tục hành trình học tập cùng DESEMBRE Academy hôm nay.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: BookOpen, label: "Khóa học đang học", value: activeCourses.length },
          { icon: PlayCircle, label: "Bài đã hoàn thành", value: completedLessons },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl border border-border/70 bg-card p-5 card-hover">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary-dark">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="mt-4 text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {continueCourse && (
        <section>
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold">Tiếp tục học</h2>
            <Button asChild variant="ghost" className="text-primary-dark rounded-full">
              <Link to="/student/courses">Xem tất cả</Link>
            </Button>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-[1.4fr_1fr] rounded-3xl border border-border/70 bg-card p-5">
            <div className="flex gap-4">
              <div className="h-32 w-48 rounded-2xl bg-accent grid place-items-center text-muted-foreground">
                [Khóa học]
              </div>
              <div className="flex flex-col justify-between min-w-0">
                <div>
                  <div className="text-xs text-muted-foreground">Đang học</div>
                  <div className="font-semibold line-clamp-2">{continueCourse.course.title}</div>
                </div>
                <div>
                  <Progress value={continueCourse.progress_percent} className="h-2" />
                  <div className="mt-1 text-xs text-muted-foreground">
                    {Math.round(continueCourse.progress_percent)}% hoàn thành
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-end justify-end">
              <Button
                asChild
                className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground"
              >
                {continueCourse.last_accessed_lesson ? (
                  <Link
                    to="/student/courses/$slug/lessons/$lessonId"
                    params={{
                      slug: continueCourse.course.slug,
                      lessonId: continueCourse.last_accessed_lesson,
                    }}
                  >
                    Tiếp tục học
                  </Link>
                ) : (
                  <Link to="/student/courses">Đến khóa học</Link>
                )}
              </Button>
            </div>
          </div>
        </section>
      )}

      <section id="progress">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary-dark" /> Khóa học của tôi
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {currentCourses.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Bạn chưa có khóa học nào.{" "}
              <Link to="/courses" className="text-primary-dark underline">
                Khám phá ngay
              </Link>
            </div>
          )}
          {currentCourses.map((x) => (
            <div
              key={x.course.id}
              className="rounded-3xl border border-border/70 bg-card p-5 card-hover"
            >
              <div className="font-semibold line-clamp-2">{x.course.title}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {x.enrollment.status === "active" ? "Đang học" : "Hoàn thành"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {recommended.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-dark" /> Đề xuất cho bạn
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((c) => (
              <div
                key={c.id}
                className="rounded-3xl border border-border/70 bg-card p-5 card-hover"
              >
                <div className="font-semibold line-clamp-2">{c.title}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
