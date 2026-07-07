import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { CurrentStudentCourse } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getCourseOutline } from "../services/course.service";
import { toast } from "sonner";

export function StudentCourseCard({ data }: { data: CurrentStudentCourse }) {
  const { course, enrollment, progress_percent, last_accessed_lesson } = data;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    try {
      setLoading(true);
      const outline = await getCourseOutline(course.slug);
      
      const flat = outline?.modules?.flatMap((m) => m.lessons) || [];
      if (flat.length === 0) {
        toast.info("Khóa học chưa có bài học nào khả dụng.");
        return;
      }

      let targetId = last_accessed_lesson;
      let targetLesson = targetId ? flat.find(l => l.id === targetId && !l.is_locked) : null;

      if (!targetLesson) {
        targetLesson = flat.find(l => !l.is_locked);
      }

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

  return (
    <div className="group block rounded-3xl bg-card overflow-hidden border border-border/70 relative flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden bg-accent grid place-items-center">
        <span className="text-muted-foreground">[Khóa học]</span>
        {course.category && (
          <Badge className="absolute left-3 top-3 rounded-full bg-white/90 text-primary-dark border-0 backdrop-blur">
            {course.category.name}
          </Badge>
        )}
        {enrollment.status === "completed" && (
          <Badge className="absolute right-3 top-3 rounded-full bg-success text-white border-0">
            Hoàn thành
          </Badge>
        )}
        {enrollment.status === "pending" && (
          <Badge className="absolute right-3 top-3 rounded-full bg-warning text-white border-0">
            Chờ duyệt
          </Badge>
        )}
        {enrollment.status === "active" && (
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

        {enrollment.status === "active" && (
          <div className="mt-4">
            <div className="h-1.5 rounded-full bg-accent overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress_percent}%` }}
              />
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground flex justify-between items-center">
              <span>Tiến độ {Math.round(progress_percent)}%</span>
            </div>
          </div>
        )}

        <div className="mt-5 pt-5 border-t border-border/50 mt-auto">
          <Button 
            className="w-full rounded-full" 
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Tiếp tục học
          </Button>
        </div>
      </div>
    </div>
  );
}
