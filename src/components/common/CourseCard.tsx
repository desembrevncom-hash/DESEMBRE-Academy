import { Link } from "@tanstack/react-router";
import { Clock, PlayCircle, Star, Users } from "lucide-react";
import type { Course } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";

const levelLabel: Record<Course["level"], string> = {
  "co-ban": "Cơ bản",
  "trung-cap": "Trung cấp",
  "nang-cao": "Nâng cao",
};

export function CourseCard({ course }: { course: Course }) {
  const { isEnrolled, getCourseProgress } = useAppStore();
  const enrollment = isEnrolled(course.id);
  const progress = enrollment ? getCourseProgress(course.id) : 0;

  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className="group block rounded-3xl bg-card card-hover overflow-hidden border border-border/70"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-accent">
        <img
          src={course.thumbnailUrl}
          alt={course.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <Badge className="absolute left-3 top-3 rounded-full bg-white/90 text-primary-dark border-0 backdrop-blur">
          {levelLabel[course.level]}
        </Badge>
        {enrollment?.status === "completed" && (
          <Badge className="absolute right-3 top-3 rounded-full bg-success text-white border-0">Hoàn thành</Badge>
        )}
        {enrollment?.status === "pending" && (
          <Badge className="absolute right-3 top-3 rounded-full bg-warning text-white border-0">Chờ duyệt</Badge>
        )}
        {enrollment?.status === "approved" && enrollment.progress < 100 && (
          <Badge className="absolute right-3 top-3 rounded-full bg-primary text-white border-0">Đang học</Badge>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-base font-semibold leading-snug line-clamp-2 min-h-[3rem]">{course.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{course.shortDescription}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" />{course.lessonCount} bài</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{Math.round(course.durationMinutes / 60)}h</span>
          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{course.enrolledCount.toLocaleString("vi-VN")}</span>
          <span className="inline-flex items-center gap-1 text-warning"><Star className="h-3.5 w-3.5 fill-current" />{course.rating}</span>
        </div>
        {enrollment?.status === "approved" && (
          <div className="mt-4">
            <div className="h-1.5 rounded-full bg-accent overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">Tiến độ {progress}%</div>
          </div>
        )}
      </div>
    </Link>
  );
}
