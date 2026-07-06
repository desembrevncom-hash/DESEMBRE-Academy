import { Link } from "@tanstack/react-router";
import type { CourseCatalogItem } from "../types";
import { Badge } from "@/components/ui/badge";

export function CatalogCourseCard({ course }: { course: CourseCatalogItem }) {
  const enrollment = course.current_enrollment_summary;
  const progress = course.current_progress_summary?.progress_percent ?? 0;

  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className="group block rounded-3xl bg-card card-hover overflow-hidden border border-border/70"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-accent grid place-items-center">
        <span className="text-muted-foreground">[Khóa học]</span>
        {course.category && (
          <Badge className="absolute left-3 top-3 rounded-full bg-white/90 text-primary-dark border-0 backdrop-blur">
            {course.category.name}
          </Badge>
        )}
        {enrollment?.status === "completed" && (
          <Badge className="absolute right-3 top-3 rounded-full bg-success text-white border-0">
            Hoàn thành
          </Badge>
        )}
        {enrollment?.status === "pending" && (
          <Badge className="absolute right-3 top-3 rounded-full bg-warning text-white border-0">
            Chờ duyệt
          </Badge>
        )}
        {enrollment?.status === "active" && (
          <Badge className="absolute right-3 top-3 rounded-full bg-primary text-white border-0">
            Đang học
          </Badge>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-base font-semibold leading-snug line-clamp-2 min-h-[3rem]">
          {course.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {course.description || "Chưa có mô tả"}
        </p>

        {enrollment?.status === "active" && (
          <div className="mt-4">
            <div className="h-1.5 rounded-full bg-accent overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">
              Tiến độ {Math.round(progress)}%
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
