import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCourseRuntime } from "@/features/courses/useCourseRuntime";
import { StudentCourseCard } from "@/features/courses/components/StudentCourseCard";
import { CatalogCourseCard } from "@/features/courses/components/CatalogCourseCard";
import { EmptyState } from "@/components/common/States";
import { BookOpen, Compass } from "lucide-react";

export const Route = createFileRoute("/student/courses/")({
  component: MyCoursesPage,
});

function MyCoursesPage() {
  const { currentCourses, catalog } = useCourseRuntime();
  const [tab, setTab] = useState("explore");

  const list = currentCourses.filter((c) => {
    if (tab === "active") return c.enrollment.status === "active";
    if (tab === "pending") return c.enrollment.status === "pending";
    if (tab === "completed") return c.enrollment.status === "completed";
    return true; // fallback for "all"
  });

  return (
    <div className="space-y-6" data-testid="course-list-page">
      <div className="rounded-3xl hero-bg border border-border/60 p-8">
        <div className="text-xs text-primary-dark font-medium">Khóa học</div>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold">Học viện DESEMBRE</h1>
        <p className="mt-2 text-muted-foreground">
          Khám phá các khóa học mới hoặc theo dõi tiến độ học tập của bạn.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-full bg-card border border-border/70 p-1 flex-wrap h-auto">
          <TabsTrigger
            value="explore"
            className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Khám phá
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Khóa học của tôi
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
        </TabsList>

        <TabsContent value="explore" className="mt-6">
          {catalog.length === 0 ? (
            <EmptyState
              title="Chưa có khóa học nào"
              description="Hiện tại chưa có khóa học mới nào dành cho bạn."
              icon={<Compass className="h-6 w-6" />}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {catalog.map((c) => (
                <CatalogCourseCard key={c.id} course={c} />
              ))}
            </div>
          )}
        </TabsContent>

        {tab !== "explore" && (
          <TabsContent value={tab} className="mt-6">
            {list.length === 0 ? (
              <EmptyState
                title="Chưa có khóa học nào"
                description="Bạn chưa đăng ký khóa học nào trong mục này."
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
        )}
      </Tabs>
    </div>
  );
}
