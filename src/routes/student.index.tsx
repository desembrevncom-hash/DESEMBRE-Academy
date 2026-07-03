import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, BookOpen, Clock, PlayCircle, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { courses } from "@/data/courses";
import { useAppStore } from "@/lib/store";
import { CourseCard } from "@/components/common/CourseCard";

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
  const { student, enrollments, getCourseProgress, progress } = useAppStore();

  const enrolledCourses = enrollments
    .filter((e) => e.status === "approved")
    .map((e) => ({ enrollment: e, course: courses.find((c) => c.id === e.courseId)! }))
    .filter((x) => x.course);

  const completedCount = enrollments.filter((e) => e.status === "completed").length;
  const totalMinutes = enrolledCourses.reduce((sum, x) => sum + Math.round((x.course.durationMinutes * getCourseProgress(x.course.id)) / 100), 0);
  const completedLessons = progress.filter((p) => p.completed).length;

  const continueCourse = enrolledCourses[0];
  const recommended = courses.filter((c) => !enrollments.some((e) => e.courseId === c.id)).slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl hero-bg border border-border/60 p-8">
        <div className="text-xs text-primary-dark font-medium">Bảng điều khiển</div>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold">{greeting()}, {student.fullName}</h1>
        <p className="mt-2 text-muted-foreground">Tiếp tục hành trình học tập cùng DESEMBRE Academy hôm nay.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: BookOpen, label: "Khóa học đang học", value: enrolledCourses.length },
          { icon: PlayCircle, label: "Bài đã hoàn thành", value: completedLessons },
          { icon: Clock, label: "Tổng thời gian học", value: `${Math.round(totalMinutes / 60)}h` },
          { icon: Award, label: "Chứng nhận", value: completedCount },
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
              <img src={continueCourse.course.thumbnailUrl} alt="" className="h-32 w-48 rounded-2xl object-cover" loading="lazy" />
              <div className="flex flex-col justify-between min-w-0">
                <div>
                  <div className="text-xs text-muted-foreground">Đang học</div>
                  <div className="font-semibold line-clamp-2">{continueCourse.course.title}</div>
                </div>
                <div>
                  <Progress value={getCourseProgress(continueCourse.course.id)} className="h-2" />
                  <div className="mt-1 text-xs text-muted-foreground">{getCourseProgress(continueCourse.course.id)}% hoàn thành</div>
                </div>
              </div>
            </div>
            <div className="flex items-end justify-end">
              <Button asChild className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground">
                <Link
                  to="/student/courses/$slug/lessons/$lessonId"
                  params={{
                    slug: continueCourse.course.slug,
                    lessonId: continueCourse.enrollment.lastAccessedLessonId ?? continueCourse.course.modules[0].lessons[0].id,
                  }}
                >
                  Tiếp tục học
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <section id="progress">
        <h2 className="text-xl font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary-dark" /> Khóa học của tôi</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrolledCourses.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Bạn chưa đăng ký khóa học nào. <Link to="/courses" className="text-primary-dark underline">Khám phá ngay</Link>
            </div>
          )}
          {enrolledCourses.map((x) => <CourseCard key={x.course.id} course={x.course} />)}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary-dark" /> Đề xuất cho bạn</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      </section>
    </div>
  );
}
