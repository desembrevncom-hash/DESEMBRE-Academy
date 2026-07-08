import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { CourseCatalogItem } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";
import { useCourseRuntime } from "../useCourseRuntime";
import { getCourseOutline } from "../services/course.service";
import { toast } from "sonner";

export function CatalogCourseCard({ course }: { course: CourseCatalogItem }) {
  const enrollment = course.current_enrollment_summary;
  const progress = course.current_progress_summary?.progress_percent ?? 0;
  const navigate = useNavigate();
  const { enroll, enrollmentPendingSlug } = useCourseRuntime();
  const [loading, setLoading] = useState(false);

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

      navigate({
        to: "/student/courses/$slug/lessons/$lessonId",
        params: { slug: course.slug, lessonId: targetLesson.id },
      });
    } catch (err) {
      toast.error("Không thể tải thông tin khóa học.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
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
      <div className="p-5 flex-1 flex flex-col">
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

        <div className="mt-5 pt-5 border-t border-border/50 mt-auto">
          {enrollment ? (
            <Button
              className="w-full rounded-full"
              onClick={handleNavigateToFirstLesson}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Tiếp tục học
            </Button>
          ) : !course.access_decision.can_enroll ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/50 p-2.5 rounded-xl justify-center">
              <Lock className="h-4 w-4" />
              {course.access_decision.required_tier
                ? `Yêu cầu hạng ${course.access_decision.required_tier.name}`
                : "Không thể đăng ký"}
            </div>
          ) : (
            <Button className="w-full rounded-full" onClick={handleEnroll} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Đăng ký học
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
