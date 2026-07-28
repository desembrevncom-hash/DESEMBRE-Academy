import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import type { CourseCatalogItem } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Lock, Loader2, Star, Sparkles } from "lucide-react";
import { useOptionalCourseRuntime } from "../useCourseRuntime";
import { getCourseOutline } from "../services/course.service";
import { toast } from "sonner";

export function CatalogCourseCard({ course }: { course: CourseCatalogItem }) {
  const marketing = course.marketing;
  const enrollment = course.current_enrollment_summary;
  const progress = course.current_progress_summary?.progress_percent ?? 0;
  const navigate = useNavigate();
  const runtime = useOptionalCourseRuntime();
  const enroll = runtime?.enroll;
  const enrollmentPendingSlug = runtime?.enrollmentPendingSlug;
  const [loading, setLoading] = useState(false);

  const isBlocked = course.is_blocked === true
    || (course.access_decision?.reason as string) === "ACCESS_BLOCKED"
    || (course.access_decision?.can_learn === false && (course.access_decision?.reason as string) === "ACCESS_BLOCKED");

  const isEnrolling = enrollmentPendingSlug === course.slug;
  const isLoading = loading || isEnrolling;

  const handleNavigateToFirstLesson = async () => {
    try {
      setLoading(true);
      const outline = await getCourseOutline(course.slug);
      const flat = outline?.modules?.flatMap((m) => m.lessons) || [];
      if (flat.length === 0) {
        toast.info("Khóa học chưa có bài học nào khả dụng.");
        return;
      }

      const targetLesson = flat.find((l) => !l.is_locked);
      if (!targetLesson) {
        toast.info("Không có bài học nào khả dụng.");
        return;
      }

      if (isBlocked) {
        toast.error("Truy cập bị từ chối. Khóa học này đã bị khóa.");
        setLoading(false);
        return;
      }

      navigate({
        to: "/student/courses/$slug/lessons/$lessonId",
        params: { slug: course.slug, lessonId: targetLesson.id },
      });
    } catch (err) {
      if (err === "COURSE_NOT_FOUND") {
        toast.error("Truy cập bị từ chối. Khóa học này có thể đã bị khóa.");
      } else {
        toast.error("Không thể tải thông tin khóa học.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      if (!enroll) {
        toast.info("Vui lòng đăng nhập để đăng ký khóa học.");
        navigate({ to: "/auth/phone", search: { redirect: `/courses/${course.slug}` } as any });
        return;
      }
      setLoading(true);
      await enroll(course.slug);
      toast.success("Đăng ký thành công!");
      await handleNavigateToFirstLesson();
    } catch (err) {
      toast.error("Lỗi đăng ký khóa học.");
      setLoading(false);
    }
  };

  return (
    <div className="group block rounded-3xl bg-card overflow-hidden border border-border/70 relative flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden bg-accent grid place-items-center">
        {marketing?.thumbnail_url && marketing.thumbnail_url.startsWith("https://") ? (
          <img
            src={marketing.thumbnail_url}
            alt={marketing.thumbnail_alt || course.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-muted-foreground">[Khóa học]</span>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2 pointer-events-none">
          {course.category && (
            <Badge className="rounded-full bg-white/90 text-primary-dark border-0 backdrop-blur">
              {course.category.name}
            </Badge>
          )}
          {marketing?.is_featured && (
            <Badge className="rounded-full bg-amber-500/90 text-white border-0 backdrop-blur flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Nổi bật
            </Badge>
          )}
          {marketing?.level && (
            <Badge className="rounded-full bg-blue-500/90 text-white border-0 backdrop-blur">
              {marketing.level === "basic" ? "Cơ bản" : marketing.level === "intermediate" ? "Trung cấp" : "Nâng cao"}
            </Badge>
          )}
        </div>
        {isBlocked && (
          <Badge className="absolute left-3 bottom-3 rounded-full bg-destructive text-white border-0 shadow-sm">
            Đã bị khóa
          </Badge>
        )}
        {!isBlocked && enrollment?.status === "completed" && (
          <Badge className="absolute right-3 top-3 rounded-full bg-success text-white border-0">
            Hoàn thành
          </Badge>
        )}
        {!isBlocked && enrollment?.status === "pending" && (
          <Badge className="absolute right-3 top-3 rounded-full bg-warning text-white border-0">
            Chờ duyệt
          </Badge>
        )}
        {!isBlocked && enrollment?.status === "active" && (
          <Badge className="absolute right-3 top-3 rounded-full bg-primary text-white border-0">
            Đang học
          </Badge>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-base font-semibold leading-snug line-clamp-2 min-h-[3rem]">
          {course.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {marketing?.short_description || course.description || "Chưa có mô tả"}
        </p>

        {marketing?.estimated_minutes && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{marketing.estimated_minutes} phút</span>
          </div>
        )}

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

        <div className="mt-5 pt-5 border-t border-border/50 mt-auto flex flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="w-1/2 rounded-full"
              asChild
            >
              <Link to="/courses/$slug" params={{ slug: course.slug }}>
                Xem chi tiết
              </Link>
            </Button>

            {isBlocked ? (
              <Button className="w-1/2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-not-allowed" disabled>
                Bị khóa
              </Button>
            ) : enrollment ? (
              <Button className="w-1/2 rounded-full" onClick={handleNavigateToFirstLesson} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vào học"}
              </Button>
            ) : (course.access_decision.reason as string) === "NO_STUDENT_ACCOUNT" ? (
              <Button className="w-1/2 rounded-full" onClick={handleEnroll} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đăng nhập để học"}
              </Button>
            ) : !course.access_decision.can_enroll ? (
              <Button className="w-1/2 rounded-full bg-accent text-muted-foreground" disabled>
                <Lock className="h-4 w-4 mr-1" />
                Khóa
              </Button>
            ) : (
              <Button className="w-1/2 rounded-full" onClick={handleEnroll} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đăng ký học"}
              </Button>
            )}
          </div>
          {isBlocked && (
            <p className="text-[11px] text-muted-foreground text-center">Liên hệ quản trị viên để mở khóa.</p>
          )}
          {!isBlocked && !enrollment && !course.access_decision.can_enroll && course.access_decision.required_tier && (
            <p className="text-[11px] text-muted-foreground text-center">Yêu cầu hạng {course.access_decision.required_tier.name}</p>
          )}
        </div>
      </div>
    </div>
  );
}
