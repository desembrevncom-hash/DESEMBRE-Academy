import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, PlayCircle, Search, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CategoryCard } from "@/components/common/CategoryCard";
import { CourseCard } from "@/components/common/CourseCard";
import { SectionHeading } from "@/components/common/SectionHeading";
import { categories } from "@/data/categories";
import { courses } from "@/data/courses";
import heroImg from "@/assets/hero-instructor.jpg";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const featured = courses.filter((c) => c.featured).slice(0, 6);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="px-3 sm:px-6 pt-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] sm:rounded-[36px] hero-bg border border-border/60 shadow-[var(--shadow-soft)]">
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:gap-6 lg:p-14">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 backdrop-blur px-3 py-1 text-xs font-medium text-primary-dark">
                <Sparkles className="h-3.5 w-3.5" /> DESEMBRE Academy
              </span>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
                Học đúng kiến thức.
                <br />
                <span className="text-primary-dark">Phát triển đúng hướng.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base text-muted-foreground">
                Nền tảng đào tạo dành cho khách hàng, đối tác và đội ngũ DESEMBRE. Xây dựng năng lực với các khóa
                học thực chiến từ chuyên gia hàng đầu.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground">
                  <Link to="/courses">
                    Khám phá khóa học <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full bg-white/60 backdrop-blur">
                  <Link to="/student">Khóa học của tôi</Link>
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" /> 4.9/5 đánh giá</div>
                <div>10.000+ học viên</div>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-primary/10">
                <img
                  src={heroImg}
                  alt="Giảng viên chuyên nghiệp DESEMBRE Academy"
                  width={1024}
                  height={1280}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
              </div>
              <div className="absolute -left-4 sm:left-6 bottom-6 rounded-2xl glass px-4 py-3 shadow-[var(--shadow-soft)]">
                <div className="text-xs text-muted-foreground">Đang học</div>
                <div className="text-lg font-bold text-primary-dark">10.284 học viên</div>
              </div>
              <div className="absolute -right-2 sm:right-6 top-8 rounded-2xl glass px-4 py-3 shadow-[var(--shadow-soft)]">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <PlayCircle className="h-5 w-5 text-primary" /> 220+ bài học
                </div>
              </div>
            </div>
          </div>

          {/* Search glass card */}
          <div className="px-6 sm:px-10 lg:px-14 pb-8">
            <div className="rounded-3xl glass p-4 sm:p-5 shadow-[var(--shadow-soft)]">
              <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] items-end">
                <div>
                  <label className="text-xs text-muted-foreground">Tìm khóa học</label>
                  <div className="relative mt-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Ví dụ: chốt đơn, chăm sóc khách hàng…" className="pl-9 rounded-2xl bg-white/80" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Danh mục</label>
                  <Select>
                    <SelectTrigger className="mt-1 rounded-2xl bg-white/80"><SelectValue placeholder="Tất cả danh mục" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Trình độ</label>
                  <Select>
                    <SelectTrigger className="mt-1 rounded-2xl bg-white/80"><SelectValue placeholder="Tất cả trình độ" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="co-ban">Cơ bản</SelectItem>
                      <SelectItem value="trung-cap">Trung cấp</SelectItem>
                      <SelectItem value="nang-cao">Nâng cao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button asChild className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground h-11">
                  <Link to="/courses">Tìm khóa học</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionHeading eyebrow="Danh mục" title="Danh mục đào tạo" description="Khám phá các chủ đề đào tạo trọng tâm của DESEMBRE." center />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      {/* Featured courses */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <SectionHeading
          eyebrow="Nổi bật"
          title="Khóa học nổi bật"
          description="Được chọn lọc bởi đội ngũ đào tạo DESEMBRE."
          action={
            <Button asChild variant="ghost" className="rounded-full text-primary-dark hover:bg-accent">
              <Link to="/courses">Xem tất cả <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          }
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>

      {/* About / CTA */}
      <section id="about" className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-[32px] hero-bg border border-border/60 p-10 md:p-14 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Sẵn sàng bắt đầu hành trình học tập?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Tham gia cộng đồng học viên DESEMBRE Academy — nơi tri thức được truyền đạt bởi những chuyên gia hàng đầu.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary-dark text-primary-foreground">
              <Link to="/auth/phone">Đăng nhập để bắt đầu</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-white/70">
              <Link to="/courses">Xem danh mục khóa học</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
