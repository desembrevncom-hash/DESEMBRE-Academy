import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCourseRuntime } from "@/features/courses/useCourseRuntime";
import { StudentCourseCard } from "@/features/courses/components/StudentCourseCard";
import { EmptyState } from "@/components/common/States";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/student/courses/")({
  component: MyCoursesPage,
});

function MyCoursesPage() {
  const { currentCourses } = useCourseRuntime();
  const [tab, setTab] = useState("all");

  const list = currentCourses.filter((c) => {
    if (tab === "all") return true;
    if (tab === "active") return c.enrollment.status === "active";
    if (tab === "pending") return c.enrollment.status === "pending";
    if (tab === "completed") return c.enrollment.status === "completed";
    return true;
  });

  return (
    <div className="space-y-6" data-testid="course-list-page">
      <div className="rounded-3xl hero-bg border border-border/60 p-8">
        <div className="text-xs text-primary-dark font-medium">Khóa học của tôi</div>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold">Học viên đang tham gia</h1>
        <p className="mt-2 text-muted-foreground">
          Theo dõi tiến độ học tập và tiếp tục hành trình của bạn.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-full bg-card border border-border/70 p-1">
          <TabsTrigger
            value="all"
            className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Tất cả
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Đang học
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Chờ duyệt
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Hoàn thành
          </TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-6">
          {list.length === 0 ? (
            <EmptyState
              title="Chưa có khóa học nào"
              description="Khám phá thư viện khóa học của DESEMBRE Academy."
              icon={<BookOpen className="h-6 w-6" />}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => (
                <StudentCourseCard key={c.course.id} data={c} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
