import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { z } from "zod";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CourseCard } from "@/components/common/CourseCard";
import { CourseCardSkeleton, EmptyState } from "@/components/common/States";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { courses } from "@/data/courses";
import { categories } from "@/data/categories";

const searchSchema = z.object({
  category: z.string().optional(),
  level: z.string().optional(),
  status: z.string().optional(),
  sort: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/courses")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  component: CoursesPage,
});

function CoursesPage() {
  const { category, level, sort } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let list = courses.slice();
    if (category)
      list = list.filter(
        (c) => categories.find((cat) => cat.id === c.categoryId)?.slug === category,
      );
    if (level) list = list.filter((c) => c.level === level);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (c) => c.title.toLowerCase().includes(s) || c.shortDescription.toLowerCase().includes(s),
      );
    }
    if (sort === "duration") list.sort((a, b) => a.durationMinutes - b.durationMinutes);
    else if (sort === "popular") list.sort((a, b) => b.enrolledCount - a.enrolledCount);
    return list;
  }, [category, level, sort, q]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 pt-10">
        <div className="rounded-3xl hero-bg border border-border/60 p-8 md:p-10">
          <div className="text-xs font-medium text-primary-dark">Tất cả khóa học</div>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold">Khám phá thư viện đào tạo</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Chọn khóa học phù hợp theo danh mục, trình độ và mục tiêu phát triển của bạn.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm khóa học..."
              className="pl-9 rounded-full bg-card h-11"
            />
          </div>
          <Select
            value={category ?? "all"}
            onValueChange={(v) =>
              navigate({
                search: (p: Record<string, string | undefined>) => ({
                  ...p,
                  category: v === "all" ? undefined : v,
                }),
              })
            }
          >
            <SelectTrigger className="rounded-full h-11 bg-card">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={level ?? "all"}
            onValueChange={(v) =>
              navigate({
                search: (p: Record<string, string | undefined>) => ({
                  ...p,
                  level: v === "all" ? undefined : v,
                }),
              })
            }
          >
            <SelectTrigger className="rounded-full h-11 bg-card">
              <SelectValue placeholder="Trình độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trình độ</SelectItem>
              <SelectItem value="co-ban">Cơ bản</SelectItem>
              <SelectItem value="trung-cap">Trung cấp</SelectItem>
              <SelectItem value="nang-cao">Nâng cao</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sort ?? "newest"}
            onValueChange={(v) =>
              navigate({ search: (p: Record<string, string | undefined>) => ({ ...p, sort: v }) })
            }
          >
            <SelectTrigger className="rounded-full h-11 bg-card">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="popular">Phổ biến nhất</SelectItem>
              <SelectItem value="duration">Thời lượng ngắn nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Tìm thấy {filtered.length} khóa học
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-16">
          {filtered.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState
                title="Không tìm thấy khóa học phù hợp"
                description="Thử điều chỉnh bộ lọc hoặc tìm với từ khóa khác."
                icon={<Search className="h-6 w-6" />}
              />
            </div>
          ) : (
            filtered.map((c) => <CourseCard key={c.id} course={c} />)
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

// Skeleton export kept for reference
export { CourseCardSkeleton };
