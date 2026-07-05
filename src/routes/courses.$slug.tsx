import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, CheckCircle2, ChevronRight, Clock, PlayCircle, Star, Users } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CourseCard } from "@/components/common/CourseCard";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { courses, getCourseBySlug } from "@/data/courses";
import { categories } from "@/data/categories";
import { instructors } from "@/data/instructors";
import { useAppStore } from "@/lib/store";
import type { Course } from "@/types";

export const Route = createFileRoute("/courses/$slug")({
  loader: ({ params }): { course: Course } => {
    const course = getCourseBySlug(params.slug);
    if (!course) throw notFound();
    return { course };
  },
  component: CourseDetail,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Không tìm thấy khóa học</h1>
        <Link to="/courses" className="mt-4 inline-block text-primary-dark underline">
          Quay lại danh sách
        </Link>
      </div>
    </div>
  ),
});

const levelLabel: Record<string, string> = {
  "co-ban": "Cơ bản",
  "trung-cap": "Trung cấp",
  "nang-cao": "Nâng cao",
};

function CourseDetail() {
  const { course } = Route.useLoaderData() as { course: Course };
  const navigate = useNavigate();
  const { isAuthed, isEnrolled, enroll } = useAppStore();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const category = categories.find((c) => c.id === course.categoryId);
  const instructor = instructors.find((i) => i.id === course.instructorId);
  const related = courses
    .filter((c) => c.categoryId === course.categoryId && c.id !== course.id)
    .slice(0, 3);
  const enrollment = isEnrolled(course.id);

  const handleEnrollClick = () => {
    if (!isAuthed) {
      toast.info("Vui lòng đăng nhập để đăng ký khóa học");
      navigate({ to: "/auth/phone" });
      return;
    }
    setConfirmOpen(true);
  };

  const confirmEnroll = () => {
    enroll(course.id);
    setConfirmOpen(false);
    toast.success("Đăng ký thành công. Yêu cầu đang chờ phê duyệt.");
  };

  const firstLesson = course.modules[0]?.lessons[0];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 pt-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link to="/" className="hover:text-foreground">
            Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/courses" className="hover:text-foreground">
            Khóa học
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground line-clamp-1">{course.title}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="rounded-3xl hero-bg border border-border/60 p-8">
              <div className="flex flex-wrap gap-2">
                {category && (
                  <Badge variant="secondary" className="rounded-full bg-white/70">
                    {category.name}
                  </Badge>
                )}
                <Badge className="rounded-full bg-primary text-white border-0">
                  {levelLabel[course.level]}
                </Badge>
              </div>
              <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">{course.title}</h1>
              <p className="mt-3 text-muted-foreground max-w-2xl">{course.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  {course.rating} ({course.ratingCount})
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.enrolledCount.toLocaleString("vi-VN")} học viên
                </span>
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {course.moduleCount} module · {course.lessonCount} bài
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.round(course.durationMinutes / 60)} giờ
                </span>
              </div>
            </div>

            <div className="mt-6 aspect-video overflow-hidden rounded-3xl border border-border/60 bg-accent">
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            <section className="mt-10">
              <h2 className="text-xl font-semibold">Bạn sẽ học được</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10 grid gap-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-border/70 bg-card p-6">
                <h3 className="font-semibold">Đối tượng phù hợp</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {course.audience.map((a) => (
                    <li key={a}>• {a}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-border/70 bg-card p-6">
                <h3 className="font-semibold">Yêu cầu trước khi học</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {course.requirements.map((a) => (
                    <li key={a}>• {a}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-xl font-semibold">Nội dung khóa học</h2>
              <Accordion
                type="single"
                collapsible
                defaultValue={course.modules[0]?.id}
                className="mt-4 rounded-3xl border border-border/70 bg-card divide-y"
              >
                {course.modules.map((m, idx) => (
                  <AccordionItem key={m.id} value={m.id} className="border-0 px-6">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-col items-start text-left">
                        <div className="text-xs text-muted-foreground">Module {idx + 1}</div>
                        <div className="font-semibold">{m.title}</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 pb-2">
                        {m.lessons.map((l) => (
                          <li
                            key={l.id}
                            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-accent"
                          >
                            <div className="flex items-center gap-3">
                              <PlayCircle className="h-4 w-4 text-primary" />
                              <span className="text-sm">{l.title}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{l.duration} phút</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            {instructor && (
              <section className="mt-10">
                <h2 className="text-xl font-semibold">Giảng viên</h2>
                <div className="mt-4 flex items-start gap-4 rounded-3xl border border-border/70 bg-card p-6">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary/15 text-primary-dark">
                      {instructor.name.split(" ").slice(-1)[0][0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{instructor.name}</div>
                    <div className="text-sm text-muted-foreground">{instructor.title}</div>
                    <p className="mt-2 text-sm text-muted-foreground">{instructor.bio}</p>
                  </div>
                </div>
              </section>
            )}

            <section className="mt-10">
              <h2 className="text-xl font-semibold">Học viên nói gì</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    name: "Ngọc Trâm",
                    text: "Nội dung sát thực tế, áp dụng ngay được vào công việc.",
                  },
                  { name: "Minh Tú", text: "Giảng viên tận tâm, tài liệu chi tiết, rất đáng học." },
                ].map((r) => (
                  <div key={r.name} className="rounded-3xl border border-border/70 bg-card p-5">
                    <div className="flex items-center gap-1 text-warning">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-3 text-sm">“{r.text}”</p>
                    <div className="mt-3 text-xs font-medium">{r.name}</div>
                  </div>
                ))}
              </div>
            </section>

            {related.length > 0 && (
              <section className="mt-10 pb-16">
                <h2 className="text-xl font-semibold">Khóa học liên quan</h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((c) => (
                    <CourseCard key={c.id} course={c} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sticky sidebar */}
          <aside className="lg:sticky lg:top-28 h-fit">
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="text-sm text-muted-foreground">Trạng thái</div>
              <div className="mt-1 text-lg font-semibold">
                {enrollment?.status === "pending" && "Đang chờ phê duyệt"}
                {enrollment?.status === "approved" && "Đã đăng ký"}
                {enrollment?.status === "completed" && "Đã hoàn thành"}
                {!enrollment && "Có thể đăng ký"}
              </div>
              {enrollment?.status === "approved" && firstLesson ? (
                <Button
                  asChild
                  className="mt-5 w-full rounded-full bg-primary hover:bg-primary-dark text-primary-foreground"
                >
                  <Link
                    to="/student/courses/$slug/lessons/$lessonId"
                    params={{ slug: course.slug, lessonId: firstLesson.id }}
                  >
                    Tiếp tục học
                  </Link>
                </Button>
              ) : enrollment?.status === "pending" ? (
                <Button disabled className="mt-5 w-full rounded-full">
                  Đang chờ phê duyệt
                </Button>
              ) : enrollment?.status === "completed" ? (
                <Button variant="outline" className="mt-5 w-full rounded-full">
                  Xem lại
                </Button>
              ) : (
                <Button
                  onClick={handleEnrollClick}
                  className="mt-5 w-full rounded-full bg-primary hover:bg-primary-dark text-primary-foreground"
                >
                  Đăng ký khóa học
                </Button>
              )}

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thời lượng</span>
                  <span className="font-medium">{Math.round(course.durationMinutes / 60)} giờ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số bài học</span>
                  <span className="font-medium">{course.lessonCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trình độ</span>
                  <span className="font-medium">{levelLabel[course.level]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Học viên</span>
                  <span className="font-medium">
                    {course.enrolledCount.toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Xác nhận đăng ký</DialogTitle>
            <DialogDescription>
              Bạn sẽ gửi yêu cầu đăng ký khóa học “{course.title}”. Yêu cầu sẽ chuyển sang trạng
              thái chờ phê duyệt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" className="rounded-full" onClick={() => setConfirmOpen(false)}>
              Hủy
            </Button>
            <Button
              className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground"
              onClick={confirmEnroll}
            >
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
